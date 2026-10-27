import { describe, expect, it } from 'vitest'
import { planWeek } from '@/core/schedule'
import { seedListings } from './seed'
import { categories, spelthorne } from './spelthorne'

describe('launch data', () => {
	const listings = seedListings()

	it('turns the whole leaflet into valid listings with unique addresses', () => {
		expect(listings).toHaveLength(25)
		expect(new Set(listings.map((l) => l.slug)).size).toBe(listings.length)
		for (const l of listings) {
			expect(spelthorne.towns).toContain(l.venue.town)
			expect(categories.map((c) => c.slug)).toContain(l.category)
		}
	})

	it('matches the leaflet day by day (35 sessions in a term-time week)', () => {
		const week = planWeek(listings, spelthorne, '2026-11-02')
		const count = week.map((d) => d.entries.length)
		// Mon 4, Tue 6, Wed 5 (Rhymetime at two libraries), Thu 6, Fri 10 (Jingle Tots twice and
		// Rhymetime at four libraries), Sat 4 (Rhymetime at three, and Storytime), Sun 0.
		expect(count).toEqual([4, 6, 5, 6, 10, 4, 0])
	})
})
