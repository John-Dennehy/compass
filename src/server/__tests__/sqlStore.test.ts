// @vitest-environment node
import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { beforeAll, describe, expect, it } from 'vitest'
import { detailsOf } from '@/core/changes'
import * as service from '../service'
import { type Contributor, type Store, sqlStore } from '../store'

/**
 * The same rules as the memory store tests, against real Postgres (PGlite) with the real
 * migration, so the SQL is checked too.
 */

const NOW = new Date('2026-11-03T10:00:00Z')
const BUTTERFLIES = 'butterflies-toddler-group-salvation-army'
let store: Store

beforeAll(async () => {
	const client = new PGlite()
	const migration = readFileSync(new URL('../../../drizzle/0000_init.sql', import.meta.url), 'utf8')
	for (const statement of migration.split('--> statement-breakpoint')) {
		if (statement.trim()) await client.exec(statement)
	}
	store = sqlStore(drizzle(client))
})

async function actor(c: Contributor | null, moderator = false): Promise<service.Actor> {
	return {
		visitorId: c ? `contributor:${c.id}` : crypto.randomUUID(),
		contributor: c ? await store.contributor(c.id) : null,
		moderator,
		organiserOf: c ? await store.organiserOf(c.id) : [],
	}
}

async function person(email: string): Promise<Contributor> {
	const c = {
		id: crypto.randomUUID(),
		email,
		name: null,
		approved: 0,
		rejected: 0,
		createdAt: NOW.toISOString(),
	}
	await store.createContributor(c)
	return c
}

describe('the Postgres store', () => {
	it('seeds itself once with the launch data', async () => {
		const areas = await store.areas()
		expect(areas.map((a) => a.id)).toEqual(['spelthorne'])
		expect(await store.listings('spelthorne')).toHaveLength(25)
		expect((await store.categories())[0]?.slug).toBe('stay-and-play')
		expect(await store.revisions(BUTTERFLIES)).toHaveLength(1)
		expect((await store.listing(BUTTERFLIES))?.id).toBe(BUTTERFLIES)
	})

	it('records confirmations, and only moves the checked date forwards', async () => {
		const visitor = await actor(null)
		await service.confirm(store, visitor, { listingId: BUTTERFLIES, kind: 'running' }, NOW)
		expect(await store.listing(BUTTERFLIES)).toMatchObject({
			lastConfirmedAt: NOW.toISOString(),
			lastConfirmedBy: 'visitor',
		})
		await store.markConfirmed(BUTTERFLIES, '2026-01-01T00:00:00.000Z', 'moderator')
		expect((await store.listing(BUTTERFLIES))?.lastConfirmedBy).toBe('visitor')
		expect((await store.lastConfirmation(BUTTERFLIES, visitor.visitorId))?.kind).toBe('running')
	})

	it('runs a suggestion through the queue and keeps the history', async () => {
		const parent = await actor(await person('parent@example.com'))
		const mod = await actor(await person('mod@example.com'), true)
		const listing = await store.listing(BUTTERFLIES)
		if (!listing) throw new Error('missing')
		const sent = await service.suggestChange(
			store,
			parent,
			{
				listingId: BUTTERFLIES,
				baseVersion: listing.version,
				details: { ...detailsOf(listing), cost: { kind: 'free' } },
			},
			NOW,
		)
		expect(sent).toEqual({ ok: true, status: 'queued' })
		const queue = await service.moderationQueue(store, mod, NOW)
		const id = queue?.items[0]?.suggestion.id ?? ''
		expect(
			await service.reviewSuggestion(store, mod, { id, decision: 'approve' }, NOW),
		).toMatchObject({ ok: true })
		expect(
			await service.reviewSuggestion(store, mod, { id, decision: 'approve' }, NOW),
		).toMatchObject({ ok: false })
		expect(await store.listing(BUTTERFLIES)).toMatchObject({ version: 2, cost: { kind: 'free' } })
		expect((await store.revisions(BUTTERFLIES)).map((r) => r.version)).toEqual([1, 2])
		expect((await store.contributor(parent.contributor?.id ?? ''))?.approved).toBe(1)
		// A stale version is refused.
		expect(
			await store.updateListing(
				{ ...listing, version: 2 },
				1,
				(await store.revisions(BUTTERFLIES))[0] as never,
			),
		).toBe(false)
	})

	it('uses each sign-in token once', async () => {
		await store.saveToken({
			tokenHash: 'abc',
			email: 'a@example.com',
			name: null,
			next: '/',
			expiresAt: new Date(Date.now() + 60_000).toISOString(),
		})
		expect((await store.takeToken('abc', new Date()))?.email).toBe('a@example.com')
		expect(await store.takeToken('abc', new Date())).toBeNull()
	})

	it('counts stopped reports and organisers', async () => {
		await store.addConfirmation({
			listingId: 'seedlings-staines-baptist-church',
			kind: 'stopped',
			visitorId: 'v1',
			at: NOW.toISOString(),
		})
		const reports = await store.stoppedReports(
			['seedlings-staines-baptist-church'],
			'2025-01-01T00:00:00.000Z',
		)
		expect(reports).toHaveLength(1)
		const organiser = await person('organiser@example.com')
		await store.addOrganiser(BUTTERFLIES, organiser.id)
		await store.addOrganiser(BUTTERFLIES, organiser.id)
		expect(await store.organiserOf(organiser.id)).toEqual([BUTTERFLIES])
	})
})
