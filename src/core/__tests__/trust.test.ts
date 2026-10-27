import { describe, expect, it } from 'vitest'
import { applyChanges, conflicts, describeChanges, detailsOf, diffDetails } from '../changes'
import { describeMiles, milesBetween, normalisePostcode } from '../distance'
import { freshness } from '../freshness'
import { checkLimits, looksLikeSpam, routeSuggestion, trustFor } from '../trust'
import { makeListing } from './helpers'

const person = (over: Partial<Parameters<typeof trustFor>[0]> = {}) => ({
	role: 'contributor' as const,
	approved: 0,
	rejected: 0,
	organiserOf: [],
	...over,
})

describe('trust', () => {
	it('earns trust through approved suggestions', () => {
		expect(trustFor(person())).toBe('new')
		expect(trustFor(person({ approved: 3 }))).toBe('trusted')
		expect(trustFor(person({ approved: 4, rejected: 1 }))).toBe('new')
		expect(trustFor(person({ approved: 10, rejected: 2 }))).toBe('trusted')
		expect(trustFor(person({ role: 'moderator' }))).toBe('moderator')
		expect(trustFor(person({ organiserOf: ['a'] }), 'a')).toBe('organiser')
		expect(trustFor(person({ organiserOf: ['a'] }), 'b')).toBe('new')
	})

	it('only lets organisers and moderators skip the queue', () => {
		expect(routeSuggestion('change', 'organiser')).toBe('apply')
		expect(routeSuggestion('new', 'organiser')).toBe('queue')
		expect(routeSuggestion('change', 'trusted')).toBe('queue')
		expect(routeSuggestion('new', 'moderator')).toBe('apply')
		expect(routeSuggestion('claim', 'moderator')).toBe('queue')
	})

	it('limits new contributors and everyone per day', () => {
		expect(checkLimits('new', { pending: 3, lastDay: 3 })).toMatch(/3 suggestions waiting/)
		expect(checkLimits('trusted', { pending: 3, lastDay: 3 })).toBeNull()
		expect(checkLimits('trusted', { pending: 0, lastDay: 10 })).toMatch(/tomorrow/)
		expect(checkLimits('moderator', { pending: 50, lastDay: 50 })).toBeNull()
	})

	it('spots obvious spam', () => {
		expect(looksLikeSpam('Now on Wednesdays too, see www.example.org')).toBe(false)
		expect(looksLikeSpam('http://a http://b http://c http://d')).toBe(true)
		expect(looksLikeSpam('!!!!!!!!!!!!!!!!!!!!')).toBe(true)
	})
})

describe('suggested changes', () => {
	const current = detailsOf(makeListing({ notes: 'Bring a snack.' }))

	it('keeps only what changed, and can remove optional fields', () => {
		const proposed = { ...current, cost: { kind: 'free' as const } }
		delete (proposed as { notes?: string }).notes
		const changes = diffDetails(current, proposed)
		expect(Object.keys(changes).sort()).toEqual(['cost', 'notes'])
		expect(changes.notes).toBeNull()
		// It survives being stored as JSON.
		const stored = JSON.parse(JSON.stringify(changes))
		const next = applyChanges(current, stored)
		expect(next.cost).toEqual({ kind: 'free' })
		expect(next.notes).toBeUndefined()
		expect(describeChanges(stored)).toBe('cost and notes')
	})

	it('keeps "all ages" as a real value', () => {
		const next = applyChanges(current, diffDetails(current, { ...current, ages: null }))
		expect(next.ages).toBeNull()
	})

	it('refuses changes that would break the listing', () => {
		expect(() => applyChanges(current, { name: '' })).toThrow()
	})

	it('flags fields someone else changed in the meantime', () => {
		expect(conflicts({ cost: { kind: 'free' } }, { cost: { kind: 'paid' }, name: 'New' })).toEqual([
			'cost',
		])
	})
})

describe('freshness', () => {
	it('says who checked it and when', () => {
		const recent = freshness(
			{ lastConfirmedAt: '2026-10-13T10:00:00.000Z', lastConfirmedBy: 'organiser' },
			'2026-10-27',
		)
		expect(recent).toMatchObject({ level: 'recent', label: 'Checked 2 weeks ago by the organiser' })
		const old = freshness(
			{ lastConfirmedAt: '2025-09-01T00:00:00.000Z', lastConfirmedBy: 'source' },
			'2026-10-27',
		)
		expect(old).toMatchObject({
			level: 'stale',
			label: 'Last checked in September 2025, from the council’s leaflet',
		})
		const middling = freshness(
			{ lastConfirmedAt: '2026-06-01T00:00:00.000Z', lastConfirmedBy: 'visitor' },
			'2026-10-27',
		)
		expect(middling.level).toBe('check')
	})

	it('warns when people say it has stopped', () => {
		const f = (n: number) =>
			freshness(
				{ lastConfirmedAt: '2026-10-20T00:00:00.000Z', lastConfirmedBy: 'visitor' },
				'2026-10-27',
				n,
			)
		expect(f(0).warning).toBeNull()
		expect(f(1).warning).toMatch(/Someone said/)
		expect(f(2).warning).toMatch(/2 people/)
	})
})

describe('distance', () => {
	it('measures and describes distance', () => {
		const staines = { lat: 51.4331, lng: -0.5115 }
		const ashford = { lat: 51.4343, lng: -0.4646 }
		expect(milesBetween(staines, ashford)).toBeCloseTo(2.02, 1)
		expect(describeMiles(2.02)).toBe('2 miles')
		expect(describeMiles(0.34)).toBe('0.3 miles')
		expect(describeMiles(1)).toBe('1 mile')
	})

	it('tidies up postcodes', () => {
		expect(normalisePostcode('tw181ay')).toBe('TW18 1AY')
		expect(normalisePostcode(' TW18  1AY ')).toBe('TW18 1AY')
		expect(normalisePostcode('SW1A1AA')).toBe('SW1A 1AA')
		expect(normalisePostcode('Staines')).toBeNull()
	})
})
