import { beforeEach, describe, expect, it } from 'vitest'
import { detailsOf } from '@/core/changes'
import type { Details } from '@/core/listing'
import * as service from '../service'
import { type Contributor, memoryStore, type Store } from '../store'

const NOW = new Date('2026-11-03T10:00:00Z')
const later = (hours: number) => new Date(NOW.getTime() + hours * 60 * 60 * 1000)
const BUTTERFLIES = 'butterflies-toddler-group-salvation-army'

let store: Store

async function person(email: string, over: Partial<Contributor> = {}): Promise<Contributor> {
	const c = {
		id: crypto.randomUUID(),
		email,
		name: null,
		approved: 0,
		rejected: 0,
		createdAt: NOW.toISOString(),
		...over,
	}
	await store.createContributor(c)
	return c
}

async function actor(c: Contributor | null, moderator = false): Promise<service.Actor> {
	return {
		visitorId: c ? `contributor:${c.id}` : crypto.randomUUID(),
		contributor: c ? ((await store.contributor(c.id)) ?? c) : null,
		moderator,
		organiserOf: c ? await store.organiserOf(c.id) : [],
	}
}

async function butterflies(): Promise<Details> {
	const listing = await store.listing(BUTTERFLIES)
	if (!listing) throw new Error('missing')
	return detailsOf(listing)
}

beforeEach(() => {
	store = memoryStore()
})

describe('what’s on', () => {
	it('loads the area, defaulting to the first one', async () => {
		const data = await service.areaData(store, undefined, NOW)
		expect(data?.area.id).toBe('spelthorne')
		expect(data?.listings).toHaveLength(25)
		expect(data?.today).toBe('2026-11-03')
		expect(await service.areaData(store, 'nowhere', NOW)).toBeNull()
	})
})

describe('confirming listings', () => {
	it('lets anyone say it’s still on, once a week', async () => {
		const visitor = await actor(null)
		const first = await service.confirm(
			store,
			visitor,
			{ listingId: BUTTERFLIES, kind: 'running' },
			NOW,
		)
		expect(first).toMatchObject({ ok: true, message: expect.stringMatching(/checked today/) })
		const listing = await store.listing(BUTTERFLIES)
		expect(listing).toMatchObject({
			lastConfirmedAt: NOW.toISOString(),
			lastConfirmedBy: 'visitor',
		})
		const again = await service.confirm(
			store,
			visitor,
			{ listingId: BUTTERFLIES, kind: 'running' },
			later(24),
		)
		expect(again).toMatchObject({ message: expect.stringMatching(/already have your answer/) })
	})

	it('counts different people saying it has stopped, until someone confirms it again', async () => {
		for (const _ of [1, 2]) {
			await service.confirm(
				store,
				await actor(null),
				{ listingId: BUTTERFLIES, kind: 'stopped' },
				NOW,
			)
		}
		const data = await service.areaData(store, 'spelthorne', later(1))
		expect(data?.stopped[BUTTERFLIES]).toBe(2)
		const queue = await service.moderationQueue(
			store,
			await actor(await person('mod@example.com'), true),
			later(1),
		)
		expect(queue?.reported.map((r) => [r.listing.id, r.reports])).toEqual([[BUTTERFLIES, 2]])

		await service.confirm(
			store,
			await actor(null),
			{ listingId: BUTTERFLIES, kind: 'running' },
			later(2),
		)
		const after = await service.areaData(store, 'spelthorne', later(3))
		expect(after?.stopped[BUTTERFLIES]).toBeUndefined()
	})
})

describe('suggesting changes', () => {
	it('needs you to sign in', async () => {
		const result = await service.suggestChange(
			store,
			await actor(null),
			{ listingId: BUTTERFLIES, baseVersion: 1, details: await butterflies() },
			NOW,
		)
		expect(result).toEqual({ ok: false, message: 'Please sign in first.' })
	})

	it('queues a new contributor’s change, and a moderator approves it into the history', async () => {
		const parent = await person('parent@example.com')
		const details = {
			...(await butterflies()),
			cost: { kind: 'paid' as const, note: '£2 a family' },
		}
		const sent = await service.suggestChange(
			store,
			await actor(parent),
			{ listingId: BUTTERFLIES, baseVersion: 1, details, message: 'Asked at the door' },
			NOW,
		)
		expect(sent).toEqual({ ok: true, status: 'queued' })
		expect((await store.listing(BUTTERFLIES))?.cost).toEqual({ kind: 'unknown' })

		const mod = await actor(await person('mod@example.com'), true)
		const queue = await service.moderationQueue(store, mod, NOW)
		const [item] = queue?.items ?? []
		expect(item?.suggestion.changes).toEqual({ cost: { kind: 'paid', note: '£2 a family' } })
		expect(item?.preview?.cost.note).toBe('£2 a family')
		expect(item?.contributor.trust).toBe('new')

		const reviewed = await service.reviewSuggestion(
			store,
			mod,
			{ id: item?.suggestion.id ?? '', decision: 'approve' },
			later(1),
		)
		expect(reviewed).toMatchObject({ ok: true, slug: BUTTERFLIES })
		const listing = await store.listing(BUTTERFLIES)
		expect(listing).toMatchObject({
			version: 2,
			cost: { kind: 'paid', note: '£2 a family' },
			lastConfirmedBy: 'contributor',
		})
		const history = await service.listingHistory(store, BUTTERFLIES, await actor(null))
		expect(history?.revisions.map((r) => r.version)).toEqual([2, 1])
		// What they told the moderators isn't shown in the public history.
		expect(history?.revisions[0]?.note).toBeNull()
		expect((await store.contributor(parent.id))?.approved).toBe(1)

		const twice = await service.reviewSuggestion(
			store,
			mod,
			{ id: item?.suggestion.id ?? '', decision: 'reject' },
			later(2),
		)
		expect(twice.ok).toBe(false)
	})

	it('refuses an empty change and a broken one', async () => {
		const parent = await actor(await person('parent@example.com'))
		const same = await service.suggestChange(
			store,
			parent,
			{ listingId: BUTTERFLIES, baseVersion: 1, details: await butterflies() },
			NOW,
		)
		expect(same).toEqual({ ok: false, message: 'Nothing has changed yet.' })
		const broken = await service.suggestChange(
			store,
			parent,
			{ listingId: BUTTERFLIES, baseVersion: 1, details: { ...(await butterflies()), name: '' } },
			NOW,
		)
		expect(broken.ok).toBe(false)
		const elsewhere = await service.suggestChange(
			store,
			parent,
			{
				listingId: BUTTERFLIES,
				baseVersion: 1,
				details: {
					...(await butterflies()),
					venue: { ...(await butterflies()).venue, town: 'Woking' },
				},
			},
			NOW,
		)
		expect(elsewhere).toEqual({ ok: false, message: 'Choose a town in Spelthorne.' })
	})

	it('does not undo changes made since someone started editing', async () => {
		const mod = await actor(await person('mod@example.com'), true)
		const parent = await actor(await person('parent@example.com'))
		const base = await butterflies()
		// The parent changes the notes from version 1...
		await service.suggestChange(
			store,
			parent,
			{ listingId: BUTTERFLIES, baseVersion: 1, details: { ...base, notes: 'Bring a snack.' } },
			NOW,
		)
		// ...while a moderator changes the cost.
		await service.suggestChange(
			store,
			mod,
			{ listingId: BUTTERFLIES, baseVersion: 1, details: { ...base, cost: { kind: 'free' } } },
			NOW,
		)
		const [item] = (await service.moderationQueue(store, mod, NOW))?.items ?? []
		expect(item?.suggestion.changes).toEqual({ notes: 'Bring a snack.' })
		await service.reviewSuggestion(
			store,
			mod,
			{ id: item?.suggestion.id ?? '', decision: 'approve' },
			NOW,
		)
		expect(await store.listing(BUTTERFLIES)).toMatchObject({
			version: 3,
			notes: 'Bring a snack.',
			cost: { kind: 'free' },
		})
	})

	it('lets a verified organiser update their own listing directly', async () => {
		const organiser = await person('organiser@example.com')
		const mod = await actor(await person('mod@example.com'), true)
		await service.claimListing(
			store,
			await actor(organiser),
			{ listingId: BUTTERFLIES, message: 'I run Butterflies on Mondays.' },
			NOW,
		)
		const [claim] = (await service.moderationQueue(store, mod, NOW))?.items ?? []
		expect(claim?.suggestion.kind).toBe('claim')
		await service.reviewSuggestion(
			store,
			mod,
			{ id: claim?.suggestion.id ?? '', decision: 'approve' },
			NOW,
		)
		expect((await store.listing(BUTTERFLIES))?.verified).toBe(true)
		// Claims don't build trust.
		expect((await store.contributor(organiser.id))?.approved).toBe(0)

		const details = { ...(await butterflies()), notes: 'Closed on bank holidays.' }
		const saved = await service.suggestChange(
			store,
			await actor(organiser),
			{ listingId: BUTTERFLIES, baseVersion: 2, details },
			later(1),
		)
		expect(saved).toEqual({ ok: true, status: 'saved' })
		expect(await store.listing(BUTTERFLIES)).toMatchObject({
			notes: 'Closed on bank holidays.',
			lastConfirmedBy: 'organiser',
		})
		// Taking the notes out removes them.
		const without = { ...(await butterflies()) }
		delete without.notes
		await service.suggestChange(
			store,
			await actor(organiser),
			{ listingId: BUTTERFLIES, baseVersion: 3, details: without },
			later(2),
		)
		expect((await store.listing(BUTTERFLIES))?.notes).toBeUndefined()
	})

	it('limits how many suggestions a new contributor can have waiting', async () => {
		const parent = await actor(await person('parent@example.com'))
		const base = await butterflies()
		for (const n of [1, 2, 3]) {
			const r = await service.suggestChange(
				store,
				parent,
				{ listingId: BUTTERFLIES, baseVersion: 1, details: { ...base, notes: `Note ${n}` } },
				NOW,
			)
			expect(r.ok).toBe(true)
		}
		const fourth = await service.suggestChange(
			store,
			parent,
			{ listingId: BUTTERFLIES, baseVersion: 1, details: { ...base, notes: 'Note 4' } },
			NOW,
		)
		expect(fourth).toMatchObject({
			ok: false,
			message: expect.stringMatching(/3 suggestions waiting/),
		})
	})

	it('puts trusted contributors first in the queue', async () => {
		const mod = await actor(await person('mod@example.com'), true)
		const newbie = await actor(await person('new@example.com'))
		const trusted = await actor(await person('old@example.com', { approved: 5 }))
		const base = await butterflies()
		await service.suggestChange(
			store,
			newbie,
			{ listingId: BUTTERFLIES, baseVersion: 1, details: { ...base, notes: 'From new' } },
			NOW,
		)
		await service.suggestChange(
			store,
			trusted,
			{ listingId: BUTTERFLIES, baseVersion: 1, details: { ...base, notes: 'From trusted' } },
			later(1),
		)
		const queue = await service.moderationQueue(store, mod, later(2))
		expect(queue?.items.map((i) => i.suggestion.changes.notes)).toEqual([
			'From trusted',
			'From new',
		])
		expect(await service.moderationQueue(store, newbie, NOW)).toBeNull()
	})
})

describe('new listings', () => {
	const event = (): Details => ({
		name: 'Ashford Autumn Fair',
		category: 'family-events',
		whoFor: 'All families',
		ages: null,
		expecting: false,
		venue: {
			name: 'Ashford Recreation Ground',
			address: 'Clarendon Road, Ashford',
			town: 'Ashford',
			approximate: false,
		},
		when: { kind: 'one-off', dates: [{ date: '2026-11-14', start: '11:00', end: '15:00' }] },
		cost: { kind: 'free' },
		contacts: [],
		links: [],
	})

	it('queues one-off events from contributors, and moderators publish them', async () => {
		const parent = await actor(await person('parent@example.com'))
		expect(
			await service.suggestNew(store, parent, { areaId: 'spelthorne', details: event() }, NOW),
		).toEqual({ ok: true, status: 'queued' })
		const mod = await actor(await person('mod@example.com'), true)
		const [item] = (await service.moderationQueue(store, mod, NOW))?.items ?? []
		const approved = await service.reviewSuggestion(
			store,
			mod,
			{ id: item?.suggestion.id ?? '', decision: 'approve' },
			NOW,
		)
		expect(approved).toMatchObject({
			ok: true,
			slug: 'ashford-autumn-fair-ashford-recreation-ground',
		})
		const data = await service.areaData(store, 'spelthorne', NOW)
		expect(data?.listings.some((l) => l.name === 'Ashford Autumn Fair')).toBe(true)
		// Once it's over it drops out of what's on.
		const after = await service.areaData(store, 'spelthorne', new Date('2026-11-15T10:00:00Z'))
		expect(after?.listings.some((l) => l.name === 'Ashford Autumn Fair')).toBe(false)
	})

	it('gives a repeated name its own address', async () => {
		const mod = await actor(await person('mod@example.com'), true)
		const a = await service.suggestNew(store, mod, { areaId: 'spelthorne', details: event() }, NOW)
		const b = await service.suggestNew(store, mod, { areaId: 'spelthorne', details: event() }, NOW)
		expect(a).toMatchObject({
			status: 'added',
			slug: 'ashford-autumn-fair-ashford-recreation-ground',
		})
		expect(b).toMatchObject({
			status: 'added',
			slug: 'ashford-autumn-fair-ashford-recreation-ground-2',
		})
	})

	it('turns away obvious spam', async () => {
		const parent = await actor(await person('parent@example.com'))
		const spam = await service.suggestNew(
			store,
			parent,
			{
				areaId: 'spelthorne',
				details: { ...event(), notes: 'http://a http://b http://c http://d' },
			},
			NOW,
		)
		expect(spam.ok).toBe(false)
	})
})

describe('moderation', () => {
	it('hides a listing that has stopped, with a note in its history', async () => {
		const mod = await actor(await person('mod@example.com'), true)
		expect(
			await service.setHidden(
				store,
				await actor(null),
				{ listingId: BUTTERFLIES, hidden: true },
				NOW,
			),
		).toMatchObject({ ok: false })
		expect(
			await service.setHidden(store, mod, { listingId: BUTTERFLIES, hidden: true }, NOW),
		).toEqual({ ok: true })
		expect(await service.listingPage(store, BUTTERFLIES, await actor(null), NOW)).toBeNull()
		expect(await service.listingPage(store, BUTTERFLIES, mod, NOW)).not.toBeNull()
		const history = await service.listingHistory(store, BUTTERFLIES, mod)
		expect(history?.revisions[0]?.note).toMatch(/stopped running/)
	})
})
