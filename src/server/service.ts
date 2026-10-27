import { applyChanges, type Changes, conflicts, detailsOf, diffDetails } from '@/core/changes'
import { daysBetween, localNow } from '@/core/dates'
import { STOPPED_WARNING } from '@/core/freshness'
import {
	type Area,
	type Category,
	type ConfirmedBy,
	DETAIL_FIELDS,
	type Details,
	type DetailsInput,
	detailsSchema,
	type Listing,
	slugify,
} from '@/core/listing'
import { isOver } from '@/core/schedule'
import {
	checkLimits,
	LIMITS,
	looksLikeSpam,
	queuePriority,
	routeSuggestion,
	type Trust,
	trustFor,
} from '@/core/trust'
import type { Contributor, Revision, RevisionBy, Store, Suggestion } from './store'

/**
 * What Compass does, independent of HTTP. Server functions call these with the person making
 * the request (the actor), so the rules can be tested directly against the memory store.
 */

export interface Actor {
	/** An anonymous id for this browser, used for "still on" and "stopped" taps. */
	visitorId: string
	contributor: Contributor | null
	moderator: boolean
	organiserOf: string[]
}

export type Result<T = object> = ({ ok: true } & T) | { ok: false; message: string }

const fail = (message: string): { ok: false; message: string } => ({ ok: false, message })

export function trustOf(actor: Actor, listingId?: string): Trust | null {
	if (!actor.contributor) return null
	return trustFor(
		{
			role: actor.moderator ? 'moderator' : 'contributor',
			approved: actor.contributor.approved,
			rejected: actor.contributor.rejected,
			organiserOf: actor.organiserOf,
		},
		listingId,
	)
}

/** Distinct people who said each listing stopped since it was last confirmed. */
async function stoppedCounts(store: Store, listings: Listing[]): Promise<Record<string, number>> {
	if (!listings.length) return {}
	const oldest = listings.map((l) => l.lastConfirmedAt).sort()[0] ?? ''
	const reports = await store.stoppedReports(
		listings.map((l) => l.id),
		oldest,
	)
	const byListing = new Map(listings.map((l) => [l.id, l]))
	const people = new Map<string, Set<string>>()
	for (const r of reports) {
		const listing = byListing.get(r.listingId)
		if (!listing || r.at <= listing.lastConfirmedAt) continue
		const set = people.get(r.listingId) ?? new Set()
		set.add(r.visitorId)
		people.set(r.listingId, set)
	}
	return Object.fromEntries([...people].map(([id, set]) => [id, set.size]))
}

export interface AreaData {
	area: Area
	areas: { id: string; name: string }[]
	categories: Category[]
	listings: Listing[]
	stopped: Record<string, number>
	today: string
	nowMinutes: number
}

export async function areaData(
	store: Store,
	areaId: string | undefined,
	now: Date,
): Promise<AreaData | null> {
	const areas = await store.areas()
	const area = areas.find((a) => a.id === areaId) ?? (areaId ? undefined : areas[0])
	if (!area) return null
	const { date: today, minutes } = localNow(now)
	const [categories, all] = await Promise.all([store.categories(), store.listings(area.id)])
	// Finished one-off events are kept for their history, but drop out of what's on.
	const listings = all.filter((l) => !isOver(l, today))
	return {
		area,
		areas: areas.map((a) => ({ id: a.id, name: a.name })),
		categories,
		listings,
		stopped: await stoppedCounts(store, listings),
		today,
		nowMinutes: minutes,
	}
}

export async function listingPage(store: Store, key: string, actor: Actor, now: Date) {
	const listing = await store.listing(key)
	if (!listing || (listing.status === 'hidden' && !actor.moderator)) return null
	const [areas, categories, stopped, revisions] = await Promise.all([
		store.areas(),
		store.categories(),
		stoppedCounts(store, [listing]),
		store.revisions(listing.id),
	])
	const area = areas.find((a) => a.id === listing.areaId)
	if (!area) return null
	const { date: today, minutes } = localNow(now)
	return {
		listing,
		area,
		categories,
		category: categories.find((c) => c.slug === listing.category) ?? null,
		stopped: stopped[listing.id] ?? 0,
		changes: revisions.length - 1,
		trust: trustOf(actor, listing.id),
		today,
		nowMinutes: minutes,
	}
}

const BY_LABEL: Record<RevisionBy, string> = {
	source: 'Added from the council’s leaflet',
	contributor: 'Suggested by a contributor and checked by a moderator',
	organiser: 'Updated by the organiser',
	moderator: 'Updated by a moderator',
}

export async function listingHistory(store: Store, key: string, actor: Actor) {
	const listing = await store.listing(key)
	if (!listing || (listing.status === 'hidden' && !actor.moderator)) return null
	const revisions = await store.revisions(listing.id)
	return {
		listing,
		revisions: revisions
			.map((r) => ({
				version: r.version,
				at: r.at,
				who: BY_LABEL[r.by],
				changes: r.changes,
				note: r.note,
			}))
			.reverse(),
	}
}

function confirmedBy(actor: Actor, listingId: string): ConfirmedBy {
	const trust = trustOf(actor, listingId)
	if (trust === 'moderator' || trust === 'organiser') return trust
	return trust ? 'contributor' : 'visitor'
}

export async function confirm(
	store: Store,
	actor: Actor,
	input: { listingId: string; kind: 'running' | 'stopped' },
	now: Date,
): Promise<Result<{ message: string }>> {
	const listing = await store.listing(input.listingId)
	if (listing?.status !== 'published') return fail('We couldn’t find that listing.')
	const last = await store.lastConfirmation(listing.id, actor.visitorId)
	if (
		last &&
		daysBetween(last.at.slice(0, 10), now.toISOString().slice(0, 10)) < LIMITS.confirmEveryDays
	) {
		return { ok: true, message: 'Thanks, we already have your answer from this week.' }
	}
	const at = now.toISOString()
	await store.addConfirmation({
		listingId: listing.id,
		kind: input.kind,
		visitorId: actor.visitorId,
		at,
	})
	if (input.kind === 'running') {
		await store.markConfirmed(listing.id, at, confirmedBy(actor, listing.id))
		return { ok: true, message: 'Thank you. We’ve marked it as checked today.' }
	}
	return {
		ok: true,
		message:
			'Thank you. We’ll warn others to check before they go, and a moderator will take a look.',
	}
}

function checkPlace(details: Details, area: Area, categories: Category[]): string | null {
	if (!area.towns.includes(details.venue.town)) {
		return `Choose a town in ${area.name}.`
	}
	if (!categories.some((c) => c.slug === details.category))
		return 'Choose what kind of thing it is.'
	return null
}

async function uniqueSlug(store: Store, base: string): Promise<string> {
	let slug = base || 'listing'
	for (let n = 2; await store.slugTaken(slug); n++) slug = `${base}-${n}`
	return slug
}

async function limitsFor(
	store: Store,
	actor: Actor,
	trust: Trust,
	now: Date,
): Promise<string | null> {
	if (!actor.contributor) return 'Please sign in first.'
	const mine = await store.suggestionsBy(actor.contributor.id)
	const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
	return checkLimits(trust, {
		pending: mine.filter((s) => s.status === 'pending').length,
		lastDay: mine.filter((s) => s.createdAt > dayAgo).length,
	})
}

/** A listing with new details, dropping optional fields the new details leave out. */
function withDetails(listing: Listing, details: Details): Listing {
	const meta: Record<string, unknown> = { ...listing }
	for (const field of DETAIL_FIELDS) delete meta[field]
	return { ...(meta as Omit<Listing, keyof Details>), ...details }
}

function revision(
	listing: Listing,
	changes: Changes,
	by: RevisionBy,
	contributorId: string | null,
	note: string | null,
	at: string,
): Revision {
	return {
		listingId: listing.id,
		version: listing.version,
		details: detailsOf(listing),
		changes,
		by,
		contributorId,
		note,
		at,
	}
}

export async function suggestNew(
	store: Store,
	actor: Actor,
	input: { areaId: string; details: DetailsInput; message?: string; organiser?: boolean },
	now: Date,
): Promise<Result<{ status: 'added' | 'queued'; slug?: string }>> {
	const trust = trustOf(actor)
	if (!actor.contributor || !trust) return fail('Please sign in first.')
	const parsed = detailsSchema.safeParse(input.details)
	if (!parsed.success)
		return fail(parsed.error.issues[0]?.message ?? 'Something isn’t filled in right.')
	const details = parsed.data
	const areas = await store.areas()
	const area = areas.find((a) => a.id === input.areaId)
	if (!area) return fail('We couldn’t find that area.')
	const problem = checkPlace(details, area, await store.categories())
	if (problem) return fail(problem)
	if (looksLikeSpam(`${input.message ?? ''} ${details.summary ?? ''} ${details.notes ?? ''}`)) {
		return fail('That looks like spam to us. If it isn’t, please take out some of the links.')
	}
	const limit = await limitsFor(store, actor, trust, now)
	if (limit) return fail(limit)

	const at = now.toISOString()
	if (routeSuggestion('new', trust) === 'apply') {
		const slug = await uniqueSlug(store, slugify(details.name, details.venue.name))
		const listing: Listing = {
			...details,
			id: crypto.randomUUID(),
			slug,
			areaId: area.id,
			status: 'published',
			version: 1,
			verified: false,
			lastConfirmedAt: at,
			lastConfirmedBy: 'moderator',
			createdAt: at,
			updatedAt: at,
		}
		await store.createListing(
			listing,
			revision(listing, {}, 'moderator', actor.contributor.id, input.message ?? null, at),
		)
		return { ok: true, status: 'added', slug }
	}
	await store.addSuggestion({
		id: crypto.randomUUID(),
		kind: 'new',
		areaId: area.id,
		listingId: null,
		baseVersion: null,
		changes: details,
		message: joinMessage(input.message, input.organiser ? 'I run this group.' : undefined),
		contributorId: actor.contributor.id,
		priority: queuePriority(trust),
		status: 'pending',
		createdAt: at,
		reviewedAt: null,
		reviewedBy: null,
		reviewNote: null,
	})
	return { ok: true, status: 'queued' }
}

function joinMessage(...parts: (string | undefined)[]): string | null {
	const text = parts
		.map((p) => p?.trim())
		.filter(Boolean)
		.join(' ')
	return text || null
}

export async function suggestChange(
	store: Store,
	actor: Actor,
	input: { listingId: string; baseVersion: number; details: DetailsInput; message?: string },
	now: Date,
): Promise<Result<{ status: 'saved' | 'queued' }>> {
	const listing = await store.listing(input.listingId)
	if (!listing) return fail('We couldn’t find that listing.')
	const trust = trustOf(actor, listing.id)
	if (!actor.contributor || !trust) return fail('Please sign in first.')
	const parsed = detailsSchema.safeParse(input.details)
	if (!parsed.success)
		return fail(parsed.error.issues[0]?.message ?? 'Something isn’t filled in right.')
	const area = (await store.areas()).find((a) => a.id === listing.areaId)
	if (!area) return fail('We couldn’t find that area.')
	const problem = checkPlace(parsed.data, area, await store.categories())
	if (problem) return fail(problem)
	if (looksLikeSpam(`${input.message ?? ''} ${parsed.data.notes ?? ''}`)) {
		return fail('That looks like spam to us. If it isn’t, please take out some of the links.')
	}

	// Compare with the version they were looking at, so changes made since aren't undone.
	const revisions = await store.revisions(listing.id)
	const base = revisions.find((r) => r.version === input.baseVersion)?.details ?? detailsOf(listing)
	const changes = diffDetails(base, parsed.data)
	if (!Object.keys(changes).length) return fail('Nothing has changed yet.')
	const limit = await limitsFor(store, actor, trust, now)
	if (limit) return fail(limit)

	const at = now.toISOString()
	if (routeSuggestion('change', trust) === 'apply') {
		const by = trust === 'organiser' ? 'organiser' : 'moderator'
		const next: Listing = {
			...withDetails(listing, applyChanges(detailsOf(listing), changes)),
			version: listing.version + 1,
			updatedAt: at,
			lastConfirmedAt: at,
			lastConfirmedBy: by,
			verified: listing.verified || trust === 'organiser',
		}
		if (
			!(await store.updateListing(
				next,
				listing.version,
				revision(next, changes, by, actor.contributor.id, joinMessage(input.message), at),
			))
		) {
			return fail('Someone else changed this listing at the same moment. Please try again.')
		}
		return { ok: true, status: 'saved' }
	}
	await store.addSuggestion({
		id: crypto.randomUUID(),
		kind: 'change',
		areaId: listing.areaId,
		listingId: listing.id,
		baseVersion: input.baseVersion,
		changes,
		message: joinMessage(input.message),
		contributorId: actor.contributor.id,
		priority: queuePriority(trust),
		status: 'pending',
		createdAt: at,
		reviewedAt: null,
		reviewedBy: null,
		reviewNote: null,
	})
	return { ok: true, status: 'queued' }
}

export async function claimListing(
	store: Store,
	actor: Actor,
	input: { listingId: string; message: string },
	now: Date,
): Promise<Result> {
	const listing = await store.listing(input.listingId)
	if (!listing) return fail('We couldn’t find that listing.')
	const trust = trustOf(actor, listing.id)
	if (!actor.contributor || !trust) return fail('Please sign in first.')
	if (trust === 'organiser') return fail('You already look after this listing.')
	const mine = await store.suggestionsBy(actor.contributor.id)
	if (
		mine.some((s) => s.kind === 'claim' && s.listingId === listing.id && s.status === 'pending')
	) {
		return fail('You’ve already asked. A moderator will be in touch.')
	}
	const limit = await limitsFor(store, actor, trust, now)
	if (limit) return fail(limit)
	await store.addSuggestion({
		id: crypto.randomUUID(),
		kind: 'claim',
		areaId: listing.areaId,
		listingId: listing.id,
		baseVersion: listing.version,
		changes: {},
		message: joinMessage(input.message),
		contributorId: actor.contributor.id,
		priority: 0,
		status: 'pending',
		createdAt: now.toISOString(),
		reviewedAt: null,
		reviewedBy: null,
		reviewNote: null,
	})
	return { ok: true }
}

export interface QueueItem {
	suggestion: Suggestion
	contributor: {
		name: string | null
		email: string
		trust: Trust
		approved: number
		rejected: number
	}
	listing: Listing | null
	/** For a change: the listing as it would look. */
	preview: Details | null
	/** Fields that someone else changed since this suggestion was made. */
	conflicts: string[]
	problem: string | null
}

export async function moderationQueue(store: Store, actor: Actor, now: Date) {
	if (!actor.moderator) return null
	const pending = await store.pendingSuggestions()
	const items: QueueItem[] = []
	for (const suggestion of pending) {
		const person = await store.contributor(suggestion.contributorId)
		if (!person) continue
		const listing = suggestion.listingId ? await store.listing(suggestion.listingId) : null
		const trust = trustFor(
			{
				role: 'contributor',
				approved: person.approved,
				rejected: person.rejected,
				organiserOf: await store.organiserOf(person.id),
			},
			suggestion.listingId ?? undefined,
		)
		let preview: Details | null = null
		let problem: string | null = null
		let clash: string[] = []
		try {
			if (suggestion.kind === 'new') preview = detailsSchema.parse(suggestion.changes)
			if (suggestion.kind === 'change' && listing) {
				preview = applyChanges(detailsOf(listing), suggestion.changes)
				const revisions = await store.revisions(listing.id)
				const base = revisions.find((r) => r.version === suggestion.baseVersion)?.details
				if (base) clash = conflicts(diffDetails(base, detailsOf(listing)), suggestion.changes)
			}
		} catch {
			problem = 'This no longer fits the listing as it is now.'
		}
		if (suggestion.listingId && !listing) problem = 'The listing has gone.'
		items.push({
			suggestion,
			contributor: {
				name: person.name,
				email: person.email,
				trust,
				approved: person.approved,
				rejected: person.rejected,
			},
			listing,
			preview,
			conflicts: clash,
			problem,
		})
	}

	const areas = await store.areas()
	const reported: { listing: Listing; reports: number }[] = []
	for (const area of areas) {
		const listings = await store.listings(area.id)
		const counts = await stoppedCounts(store, listings)
		for (const listing of listings) {
			const reports = counts[listing.id] ?? 0
			if (reports >= 1) reported.push({ listing, reports })
		}
	}
	reported.sort((a, b) => b.reports - a.reports)
	const { date: today } = localNow(now)
	return { items, reported, today, warnAt: STOPPED_WARNING }
}

export async function reviewSuggestion(
	store: Store,
	actor: Actor,
	input: { id: string; decision: 'approve' | 'reject'; note?: string },
	now: Date,
): Promise<Result<{ slug?: string }>> {
	if (!actor.moderator || !actor.contributor) return fail('Only moderators can do that.')
	const suggestion = await store.suggestion(input.id)
	if (suggestion?.status !== 'pending') return fail('Someone has already dealt with that one.')
	const at = now.toISOString()
	const note = input.note?.trim() || null
	let slug: string | undefined

	if (input.decision === 'approve') {
		if (suggestion.kind === 'new') {
			const details = detailsSchema.parse(suggestion.changes)
			slug = await uniqueSlug(store, slugify(details.name, details.venue.name))
			const listing: Listing = {
				...details,
				id: crypto.randomUUID(),
				slug,
				areaId: suggestion.areaId,
				status: 'published',
				version: 1,
				verified: false,
				lastConfirmedAt: at,
				lastConfirmedBy: 'contributor',
				createdAt: at,
				updatedAt: at,
			}
			await store.createListing(
				listing,
				revision(listing, {}, 'contributor', suggestion.contributorId, null, at),
			)
		} else if (suggestion.listingId) {
			const listing = await store.listing(suggestion.listingId)
			if (!listing) return fail('The listing has gone.')
			slug = listing.slug
			if (suggestion.kind === 'change') {
				let details: Details
				try {
					details = applyChanges(detailsOf(listing), suggestion.changes)
				} catch {
					return fail(
						'This no longer fits the listing as it is now. Reject it and ask them to try again.',
					)
				}
				const next: Listing = {
					...withDetails(listing, details),
					version: listing.version + 1,
					updatedAt: at,
					lastConfirmedAt: at,
					lastConfirmedBy: 'contributor',
				}
				const saved = await store.updateListing(
					next,
					listing.version,
					revision(
						next,
						suggestion.changes,
						'contributor',
						suggestion.contributorId,
						// What they told the moderators stays private.
						null,
						at,
					),
				)
				if (!saved) return fail('The listing changed while you were looking. Please try again.')
			} else {
				await store.addOrganiser(listing.id, suggestion.contributorId)
				if (!listing.verified) {
					const next = { ...listing, verified: true, version: listing.version + 1, updatedAt: at }
					await store.updateListing(
						next,
						listing.version,
						revision(
							next,
							{},
							'moderator',
							actor.contributor.id,
							'The organiser now looks after this listing.',
							at,
						),
					)
				}
			}
		}
	}

	const reviewed = await store.reviewSuggestion(suggestion.id, {
		status: input.decision === 'approve' ? 'approved' : 'rejected',
		reviewedAt: at,
		reviewedBy: actor.contributor.id,
		reviewNote: note,
	})
	if (!reviewed) return fail('Someone has already dealt with that one.')
	// Claims don't count towards trust, so asking to be the organiser can't be used to build it up.
	if (suggestion.kind !== 'claim') {
		await store.recordOutcome(
			suggestion.contributorId,
			input.decision === 'approve' ? 'approved' : 'rejected',
		)
	}
	return { ok: true, slug }
}

export async function setHidden(
	store: Store,
	actor: Actor,
	input: { listingId: string; hidden: boolean; note?: string },
	now: Date,
): Promise<Result> {
	if (!actor.moderator || !actor.contributor) return fail('Only moderators can do that.')
	const listing = await store.listing(input.listingId)
	if (!listing) return fail('We couldn’t find that listing.')
	const status = input.hidden ? 'hidden' : 'published'
	if (listing.status === status) return { ok: true }
	const at = now.toISOString()
	const next: Listing = { ...listing, status, version: listing.version + 1, updatedAt: at }
	const note =
		input.note?.trim() || (input.hidden ? 'Taken down: it has stopped running.' : 'Put back up.')
	const saved = await store.updateListing(
		next,
		listing.version,
		revision(next, {}, 'moderator', actor.contributor.id, note, at),
	)
	return saved
		? { ok: true }
		: fail('The listing changed while you were looking. Please try again.')
}

export async function mySuggestions(store: Store, actor: Actor) {
	if (!actor.contributor) return null
	const mine = await store.suggestionsBy(actor.contributor.id)
	const names = new Map<string, string>()
	for (const s of mine) {
		if (s.listingId && !names.has(s.listingId)) {
			names.set(s.listingId, (await store.listing(s.listingId))?.name ?? 'A listing')
		}
	}
	return mine.map((s) => ({
		id: s.id,
		kind: s.kind,
		status: s.status,
		createdAt: s.createdAt,
		reviewNote: s.reviewNote,
		name:
			s.kind === 'new'
				? (s.changes.name ?? 'A new listing')
				: (names.get(s.listingId ?? '') ?? 'A listing'),
	}))
}
