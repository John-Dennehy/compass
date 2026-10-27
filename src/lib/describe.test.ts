import { describe, expect, it } from 'vitest'
import { makeListing } from '@/core/__tests__/helpers'
import { costLabel, describeSessions, directionsUrl, mapsUrl } from './describe'

describe('describing listings', () => {
	it('groups days that share a time', () => {
		const listing = makeListing({
			when: {
				kind: 'regular',
				sessions: [
					{ day: 'thursday', start: '10:00', end: '12:00' },
					{ day: 'monday', start: '10:00', end: '12:00' },
					{ day: 'wednesday', start: '10:00', end: '12:00' },
					{ day: 'saturday', start: '14:30' },
				],
			},
		})
		expect(describeSessions(listing, '2026-10-27')).toEqual([
			'Mondays, Wednesdays and Thursdays, 10am to 12pm',
			'Saturdays, from 2:30pm',
		])
	})

	it('describes fortnightly, monthly, labelled and one-off times', () => {
		const listing = makeListing({
			when: {
				kind: 'regular',
				sessions: [
					{
						day: 'tuesday',
						start: '09:45',
						end: '10:30',
						label: 'Babies',
						every: { kind: 'fortnight', from: '2026-10-13' },
					},
					{ day: 'friday', start: '13:00', every: { kind: 'month', week: 'last' } },
				],
			},
		})
		expect(describeSessions(listing, '2026-10-27')).toEqual([
			'Every other Tuesday, 9:45am to 10:30am (babies)',
			'The last Friday of the month, from 1pm',
		])
		const event = makeListing({
			when: { kind: 'one-off', dates: [{ date: '2026-11-14', start: '11:00', end: '15:00' }] },
		})
		expect(describeSessions(event, '2026-10-27')).toEqual(['Saturday 14 November, 11am to 3pm'])
	})

	it('links to Google Maps by name and address', () => {
		const listing = makeListing({
			venue: {
				name: 'Salvation Army',
				address: 'Woodthorpe Road, Ashford',
				postcode: 'TW15 3JY',
				town: 'Ashford',
			},
		})
		expect(mapsUrl(listing.venue)).toBe(
			'https://www.google.com/maps/search/?api=1&query=Salvation%20Army%2C%20Woodthorpe%20Road%2C%20Ashford%2C%20TW15%203JY',
		)
		expect(directionsUrl(listing.venue)).toContain('/maps/dir/?api=1&destination=Salvation')
	})

	it('describes cost', () => {
		expect(costLabel(makeListing({ cost: { kind: 'free' } }))).toBe('Free')
		expect(costLabel(makeListing({ cost: { kind: 'paid', note: '£2 a family' } }))).toBe(
			'Paid: £2 a family',
		)
		expect(costLabel(makeListing())).toBeNull()
	})
})
