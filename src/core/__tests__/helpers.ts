import { type DetailsInput, type Listing, listingSchema } from '../listing'

export const NOW = '2026-10-27T09:00:00.000Z'

/** A valid listing with sensible defaults, for tests. */
export function makeListing(over: Partial<DetailsInput> & { id?: string } = {}): Listing {
	const { id = 'test', ...details } = over
	return listingSchema.parse({
		name: 'Test Group',
		category: 'stay-and-play',
		whoFor: 'Under 5s',
		ages: { from: 0, to: 60 },
		venue: { name: 'Hall', address: '1 High Street, Staines', town: 'Staines' },
		when: { kind: 'regular', sessions: [{ day: 'monday', start: '10:00', end: '11:00' }] },
		...details,
		id,
		slug: id,
		areaId: 'spelthorne',
		status: 'published',
		version: 1,
		verified: false,
		lastConfirmedAt: NOW,
		lastConfirmedBy: 'visitor',
		createdAt: NOW,
		updatedAt: NOW,
	})
}
