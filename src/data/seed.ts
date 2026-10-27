import { type Listing, listingSchema, slugify } from '@/core/listing'
import { categories, SOURCE_DATE, seedDetails, spelthorne } from './spelthorne'

export const seedAreas = [spelthorne]
export const seedCategories = categories

/** The launch listings, ready to store. Seeded listings use their slug as their id. */
export function seedListings(): Listing[] {
	return seedDetails().map((details) => {
		const slug = slugify(details.name, details.venue.name)
		return listingSchema.parse({
			...details,
			id: slug,
			slug,
			areaId: spelthorne.id,
			status: 'published',
			version: 1,
			verified: false,
			lastConfirmedAt: SOURCE_DATE,
			lastConfirmedBy: 'source',
			createdAt: SOURCE_DATE,
			updatedAt: SOURCE_DATE,
		})
	})
}
