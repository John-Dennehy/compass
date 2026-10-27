import { z } from 'zod'
import type { Listing } from './listing'

/**
 * Finding things. The same filters work on the week, on what's coming up and on search, and
 * they live in the URL so a search can be sent to someone else.
 */

export const AGE_GROUPS = [
	{ id: 'bump', name: 'Expecting', from: 0, to: 0 },
	{ id: 'baby', name: 'Babies (under 1)', from: 0, to: 12 },
	{ id: 'toddler', name: 'Toddlers (1 to 3)', from: 12, to: 36 },
	{ id: 'preschool', name: 'Pre-school (3 to 5)', from: 36, to: 60 },
	{ id: 'school', name: 'School age (5 to 11)', from: 60, to: 132 },
] as const
export type AgeGroup = (typeof AGE_GROUPS)[number]['id']

export const filtersSchema = z.object({
	age: z.enum(AGE_GROUPS.map((g) => g.id) as [AgeGroup, ...AgeGroup[]]).optional(),
	town: z.string().max(60).optional(),
	category: z.string().max(40).optional(),
	free: z.boolean().optional(),
	q: z.string().max(80).optional(),
})
export type Filters = z.infer<typeof filtersSchema>

export function fitsAge(listing: Pick<Listing, 'ages' | 'expecting'>, age: AgeGroup): boolean {
	if (age === 'bump') return listing.expecting
	// No ages given means it's for everyone.
	if (!listing.ages) return true
	const group = AGE_GROUPS.find((g) => g.id === age)
	if (!group) return true
	return listing.ages.from < group.to && listing.ages.to > group.from
}

function normalise(text: string): string {
	return text
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/['’]/g, '')
		.replace(/&/g, ' and ')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim()
}

export function matches(listing: Listing, filters: Filters): boolean {
	if (filters.age && !fitsAge(listing, filters.age)) return false
	if (filters.town && listing.venue.town !== filters.town) return false
	if (filters.category && listing.category !== filters.category) return false
	if (filters.free && listing.cost.kind !== 'free') return false
	if (filters.q) {
		const haystack = normalise(
			[
				listing.name,
				listing.summary,
				listing.whoFor,
				listing.venue.name,
				listing.venue.address,
				listing.venue.town,
				listing.notes,
			].join(' '),
		)
		const words = normalise(filters.q).split(' ').filter(Boolean)
		if (!words.every((w) => haystack.includes(w))) return false
	}
	return true
}

export function activeFilterCount(filters: Filters): number {
	return [filters.age, filters.town, filters.category, filters.free, filters.q].filter(Boolean)
		.length
}

/** "Expectant parents and under 1s", from the ages, when the organiser didn't say. */
export function describeAges(listing: Pick<Listing, 'ages' | 'expecting'>): string {
	const years = (months: number) =>
		months % 12 === 0 ? `${months / 12}` : `${Math.round((months / 12) * 10) / 10}`
	let ages = 'All ages'
	if (listing.ages) {
		const { from, to } = listing.ages
		if (from === 0) ages = to < 24 ? `Under ${to} months` : `Under ${years(to)}s`
		else ages = `${years(from)} to ${years(to)} years`
	}
	return listing.expecting ? `Expectant parents, and ${ages.toLowerCase()}` : ages
}
