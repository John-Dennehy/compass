import { neon } from '@neondatabase/serverless'
import { and, asc, eq, gt, inArray, lt, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/neon-http'
import type { PgDatabase } from 'drizzle-orm/pg-core'
import type { Changes } from '@/core/changes'
import { detailsOf } from '@/core/changes'
import type { Area, Category, ConfirmedBy, Details, Listing } from '@/core/listing'
import { seedAreas, seedCategories, seedListings } from '@/data/seed'
import * as t from './schema'

export interface Contributor {
	id: string
	email: string
	name: string | null
	approved: number
	rejected: number
	createdAt: string
}

export type RevisionBy = 'source' | 'contributor' | 'organiser' | 'moderator'

export interface Revision {
	listingId: string
	version: number
	details: Details
	changes: Changes
	by: RevisionBy
	contributorId: string | null
	note: string | null
	at: string
}

export interface Confirmation {
	listingId: string
	kind: 'running' | 'stopped'
	visitorId: string
	at: string
}

export interface Suggestion {
	id: string
	kind: 'new' | 'change' | 'claim'
	areaId: string
	listingId: string | null
	baseVersion: number | null
	changes: Changes
	message: string | null
	contributorId: string
	priority: number
	status: 'pending' | 'approved' | 'rejected'
	createdAt: string
	reviewedAt: string | null
	reviewedBy: string | null
	reviewNote: string | null
}

export interface SignInToken {
	tokenHash: string
	email: string
	name: string | null
	next: string
	expiresAt: string
}

export interface Store {
	areas(): Promise<Area[]>
	categories(): Promise<Category[]>
	listings(areaId: string, includeHidden?: boolean): Promise<Listing[]>
	/** By id or by slug. */
	listing(key: string): Promise<Listing | null>
	slugTaken(slug: string): Promise<boolean>
	createListing(listing: Listing, revision: Revision): Promise<void>
	/** Saves a new version, only if nobody else saved one first. */
	updateListing(listing: Listing, expectedVersion: number, revision: Revision): Promise<boolean>
	/** Records that a listing is still right, without changing it. */
	markConfirmed(listingId: string, at: string, by: ConfirmedBy): Promise<void>
	revisions(listingId: string): Promise<Revision[]>

	addConfirmation(confirmation: Confirmation): Promise<void>
	lastConfirmation(listingId: string, visitorId: string): Promise<Confirmation | null>
	/** "Stopped" reports since a date, for these listings. */
	stoppedReports(listingIds: string[], since: string): Promise<Confirmation[]>

	contributorByEmail(email: string): Promise<Contributor | null>
	contributor(id: string): Promise<Contributor | null>
	createContributor(contributor: Contributor): Promise<void>
	recordOutcome(contributorId: string, outcome: 'approved' | 'rejected'): Promise<void>
	organiserOf(contributorId: string): Promise<string[]>
	addOrganiser(listingId: string, contributorId: string): Promise<void>

	addSuggestion(suggestion: Suggestion): Promise<void>
	suggestion(id: string): Promise<Suggestion | null>
	pendingSuggestions(): Promise<Suggestion[]>
	suggestionsBy(contributorId: string): Promise<Suggestion[]>
	/** Marks a pending suggestion as reviewed. False if someone already reviewed it. */
	reviewSuggestion(
		id: string,
		review: Pick<Suggestion, 'status' | 'reviewedAt' | 'reviewedBy' | 'reviewNote'>,
	): Promise<boolean>

	saveToken(token: SignInToken): Promise<void>
	/** Uses up a sign-in token, returning it if it was valid. */
	takeToken(tokenHash: string, now: Date): Promise<SignInToken | null>
}

export function sourceRevision(listing: Listing): Revision {
	return {
		listingId: listing.id,
		version: listing.version,
		details: detailsOf(listing),
		changes: {},
		by: 'source',
		contributorId: null,
		note: null,
		at: listing.createdAt,
	}
}

const iso = (d: Date | null) => (d ? d.toISOString() : null)

/** Any Postgres through Drizzle: Neon in production, PGlite in tests. */
// biome-ignore lint/suspicious/noExplicitAny: the store works with any Postgres driver
export function sqlStore(db: PgDatabase<any, any>): Store {
	let seeded: Promise<void> | undefined

	/** Fills an empty database with the launch data, once. */
	function ensureSeeded(): Promise<void> {
		seeded ??= (async () => {
			const existing = await db.select({ id: t.areas.id }).from(t.areas).limit(1)
			if (existing.length) return
			await db
				.insert(t.areas)
				.values(seedAreas.map((data) => ({ id: data.id, data })))
				.onConflictDoNothing()
			await db
				.insert(t.categories)
				.values(seedCategories.map((c, position) => ({ ...c, position })))
				.onConflictDoNothing()
			const all = seedListings()
			await db
				.insert(t.listings)
				.values(
					all.map((l) => ({
						id: l.id,
						slug: l.slug,
						areaId: l.areaId,
						status: l.status,
						version: l.version,
						data: l,
						updatedAt: new Date(l.updatedAt),
					})),
				)
				.onConflictDoNothing()
			await db
				.insert(t.revisions)
				.values(all.map((l) => toRevisionRow(sourceRevision(l))))
				.onConflictDoNothing()
		})().catch((error) => {
			seeded = undefined
			throw error
		})
		return seeded
	}

	const toRevisionRow = (r: Revision) => ({ ...r, at: new Date(r.at) })
	const toSuggestion = (row: typeof t.suggestions.$inferSelect): Suggestion => ({
		...row,
		createdAt: row.createdAt.toISOString(),
		reviewedAt: iso(row.reviewedAt),
	})
	const toContributor = (row: typeof t.contributors.$inferSelect): Contributor => ({
		...row,
		createdAt: row.createdAt.toISOString(),
	})

	return {
		async areas() {
			await ensureSeeded()
			const rows = await db.select().from(t.areas)
			return rows.map((r) => r.data)
		},
		async categories() {
			await ensureSeeded()
			return db
				.select({
					slug: t.categories.slug,
					name: t.categories.name,
					description: t.categories.description,
				})
				.from(t.categories)
				.orderBy(asc(t.categories.position))
		},
		async listings(areaId, includeHidden = false) {
			await ensureSeeded()
			const rows = await db
				.select({ data: t.listings.data })
				.from(t.listings)
				.where(
					includeHidden
						? eq(t.listings.areaId, areaId)
						: and(eq(t.listings.areaId, areaId), eq(t.listings.status, 'published')),
				)
			return rows.map((r) => r.data)
		},
		async listing(key) {
			await ensureSeeded()
			const [row] = await db
				.select({ data: t.listings.data })
				.from(t.listings)
				.where(sql`${t.listings.id} = ${key} or ${t.listings.slug} = ${key}`)
				.limit(1)
			return row?.data ?? null
		},
		async slugTaken(slug) {
			const rows = await db
				.select({ id: t.listings.id })
				.from(t.listings)
				.where(eq(t.listings.slug, slug))
				.limit(1)
			return rows.length > 0
		},
		async createListing(listing, revision) {
			await db.insert(t.listings).values({
				id: listing.id,
				slug: listing.slug,
				areaId: listing.areaId,
				status: listing.status,
				version: listing.version,
				data: listing,
				updatedAt: new Date(listing.updatedAt),
			})
			await db.insert(t.revisions).values(toRevisionRow(revision))
		},
		async updateListing(listing, expectedVersion, revision) {
			const updated = await db
				.update(t.listings)
				.set({
					slug: listing.slug,
					status: listing.status,
					version: listing.version,
					data: listing,
					updatedAt: new Date(listing.updatedAt),
				})
				.where(and(eq(t.listings.id, listing.id), eq(t.listings.version, expectedVersion)))
				.returning({ id: t.listings.id })
			if (!updated.length) return false
			await db.insert(t.revisions).values(toRevisionRow(revision))
			return true
		},
		async markConfirmed(listingId, at, by) {
			// Only ever moves the date forwards.
			await db
				.update(t.listings)
				.set({
					data: sql`jsonb_set(jsonb_set(${t.listings.data}, '{lastConfirmedAt}', to_jsonb(${at}::text)), '{lastConfirmedBy}', to_jsonb(${by}::text))`,
				})
				.where(
					and(eq(t.listings.id, listingId), sql`(${t.listings.data}->>'lastConfirmedAt') < ${at}`),
				)
		},
		async revisions(listingId) {
			const rows = await db
				.select()
				.from(t.revisions)
				.where(eq(t.revisions.listingId, listingId))
				.orderBy(asc(t.revisions.version))
			return rows.map(({ id: _id, ...r }) => ({ ...r, at: r.at.toISOString() }))
		},
		async addConfirmation(c) {
			await db.insert(t.confirmations).values({ ...c, at: new Date(c.at) })
		},
		async lastConfirmation(listingId, visitorId) {
			const [row] = await db
				.select()
				.from(t.confirmations)
				.where(
					and(eq(t.confirmations.listingId, listingId), eq(t.confirmations.visitorId, visitorId)),
				)
				.orderBy(sql`${t.confirmations.at} desc`)
				.limit(1)
			return row ? { ...row, at: row.at.toISOString() } : null
		},
		async stoppedReports(listingIds, since) {
			if (!listingIds.length) return []
			const rows = await db
				.select()
				.from(t.confirmations)
				.where(
					and(
						inArray(t.confirmations.listingId, listingIds),
						eq(t.confirmations.kind, 'stopped'),
						gt(t.confirmations.at, new Date(since)),
					),
				)
			return rows.map(({ id: _id, ...r }) => ({ ...r, at: r.at.toISOString() }))
		},
		async contributorByEmail(email) {
			const [row] = await db.select().from(t.contributors).where(eq(t.contributors.email, email))
			return row ? toContributor(row) : null
		},
		async contributor(id) {
			const [row] = await db.select().from(t.contributors).where(eq(t.contributors.id, id))
			return row ? toContributor(row) : null
		},
		async createContributor(c) {
			await db
				.insert(t.contributors)
				.values({ ...c, createdAt: new Date(c.createdAt) })
				.onConflictDoNothing()
		},
		async recordOutcome(contributorId, outcome) {
			const column = outcome === 'approved' ? t.contributors.approved : t.contributors.rejected
			await db
				.update(t.contributors)
				.set({ [outcome]: sql`${column} + 1` })
				.where(eq(t.contributors.id, contributorId))
		},
		async organiserOf(contributorId) {
			const rows = await db
				.select({ listingId: t.organisers.listingId })
				.from(t.organisers)
				.where(eq(t.organisers.contributorId, contributorId))
			return rows.map((r) => r.listingId)
		},
		async addOrganiser(listingId, contributorId) {
			await db.insert(t.organisers).values({ listingId, contributorId }).onConflictDoNothing()
		},
		async addSuggestion(s) {
			await db.insert(t.suggestions).values({
				...s,
				createdAt: new Date(s.createdAt),
				reviewedAt: s.reviewedAt ? new Date(s.reviewedAt) : null,
			})
		},
		async suggestion(id) {
			const [row] = await db.select().from(t.suggestions).where(eq(t.suggestions.id, id))
			return row ? toSuggestion(row) : null
		},
		async pendingSuggestions() {
			const rows = await db
				.select()
				.from(t.suggestions)
				.where(eq(t.suggestions.status, 'pending'))
				.orderBy(asc(t.suggestions.priority), asc(t.suggestions.createdAt))
			return rows.map(toSuggestion)
		},
		async suggestionsBy(contributorId) {
			const rows = await db
				.select()
				.from(t.suggestions)
				.where(eq(t.suggestions.contributorId, contributorId))
				.orderBy(sql`${t.suggestions.createdAt} desc`)
				.limit(100)
			return rows.map(toSuggestion)
		},
		async reviewSuggestion(id, review) {
			const rows = await db
				.update(t.suggestions)
				.set({ ...review, reviewedAt: review.reviewedAt ? new Date(review.reviewedAt) : null })
				.where(and(eq(t.suggestions.id, id), eq(t.suggestions.status, 'pending')))
				.returning({ id: t.suggestions.id })
			return rows.length > 0
		},
		async saveToken(token) {
			await db.delete(t.signInTokens).where(lt(t.signInTokens.expiresAt, new Date()))
			await db.insert(t.signInTokens).values({ ...token, expiresAt: new Date(token.expiresAt) })
		},
		async takeToken(tokenHash, now) {
			const [row] = await db
				.delete(t.signInTokens)
				.where(eq(t.signInTokens.tokenHash, tokenHash))
				.returning()
			if (!row || row.expiresAt <= now) return null
			return { ...row, expiresAt: row.expiresAt.toISOString() }
		},
	}
}

/** Keeps everything in memory, seeded with the launch data, so Compass runs without a database. */
export function memoryStore(): Store {
	const areas = structuredClone(seedAreas)
	const categories = structuredClone(seedCategories)
	const listings = new Map(seedListings().map((l) => [l.id, l]))
	const revisions: Revision[] = [...listings.values()].map(sourceRevision)
	const confirmations: Confirmation[] = []
	const contributors = new Map<string, Contributor>()
	const organisers: { listingId: string; contributorId: string }[] = []
	const suggestions = new Map<string, Suggestion>()
	const tokens = new Map<string, SignInToken>()
	const copy = structuredClone

	return {
		async areas() {
			return copy(areas)
		},
		async categories() {
			return copy(categories)
		},
		async listings(areaId, includeHidden = false) {
			return copy(
				[...listings.values()].filter(
					(l) => l.areaId === areaId && (includeHidden || l.status === 'published'),
				),
			)
		},
		async listing(key) {
			const found = listings.get(key) ?? [...listings.values()].find((l) => l.slug === key)
			return found ? copy(found) : null
		},
		async slugTaken(slug) {
			return [...listings.values()].some((l) => l.slug === slug)
		},
		async createListing(listing, revision) {
			if (listings.has(listing.id)) throw new Error('That listing already exists')
			listings.set(listing.id, copy(listing))
			revisions.push(copy(revision))
		},
		async updateListing(listing, expectedVersion, revision) {
			const current = listings.get(listing.id)
			if (!current || current.version !== expectedVersion) return false
			listings.set(listing.id, copy(listing))
			revisions.push(copy(revision))
			return true
		},
		async markConfirmed(listingId, at, by) {
			const current = listings.get(listingId)
			if (current && current.lastConfirmedAt < at) {
				listings.set(listingId, { ...current, lastConfirmedAt: at, lastConfirmedBy: by })
			}
		},
		async revisions(listingId) {
			return copy(revisions.filter((r) => r.listingId === listingId))
		},
		async addConfirmation(c) {
			confirmations.push(copy(c))
		},
		async lastConfirmation(listingId, visitorId) {
			const mine = confirmations.filter(
				(c) => c.listingId === listingId && c.visitorId === visitorId,
			)
			return copy(mine.at(-1) ?? null)
		},
		async stoppedReports(listingIds, since) {
			const ids = new Set(listingIds)
			return copy(
				confirmations.filter((c) => ids.has(c.listingId) && c.kind === 'stopped' && c.at > since),
			)
		},
		async contributorByEmail(email) {
			return copy([...contributors.values()].find((c) => c.email === email) ?? null)
		},
		async contributor(id) {
			return copy(contributors.get(id) ?? null)
		},
		async createContributor(c) {
			if (![...contributors.values()].some((x) => x.email === c.email))
				contributors.set(c.id, copy(c))
		},
		async recordOutcome(contributorId, outcome) {
			const c = contributors.get(contributorId)
			if (c) c[outcome] += 1
		},
		async organiserOf(contributorId) {
			return organisers.filter((o) => o.contributorId === contributorId).map((o) => o.listingId)
		},
		async addOrganiser(listingId, contributorId) {
			if (!organisers.some((o) => o.listingId === listingId && o.contributorId === contributorId)) {
				organisers.push({ listingId, contributorId })
			}
		},
		async addSuggestion(s) {
			suggestions.set(s.id, copy(s))
		},
		async suggestion(id) {
			return copy(suggestions.get(id) ?? null)
		},
		async pendingSuggestions() {
			return copy(
				[...suggestions.values()]
					.filter((s) => s.status === 'pending')
					.sort((a, b) => a.priority - b.priority || a.createdAt.localeCompare(b.createdAt)),
			)
		},
		async suggestionsBy(contributorId) {
			return copy(
				[...suggestions.values()]
					.filter((s) => s.contributorId === contributorId)
					.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
			)
		},
		async reviewSuggestion(id, review) {
			const s = suggestions.get(id)
			if (s?.status !== 'pending') return false
			suggestions.set(id, { ...s, ...review })
			return true
		},
		async saveToken(token) {
			tokens.set(token.tokenHash, copy(token))
		},
		async takeToken(tokenHash, now) {
			const token = tokens.get(tokenHash)
			tokens.delete(tokenHash)
			return token && new Date(token.expiresAt) > now ? copy(token) : null
		},
	}
}

let store: Store | undefined

export function getStore(): Store {
	store ??= process.env.DATABASE_URL
		? sqlStore(drizzle(neon(process.env.DATABASE_URL)))
		: memoryStore()
	return store
}
