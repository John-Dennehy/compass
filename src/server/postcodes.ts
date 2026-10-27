import { normalisePostcode, type Point } from '@/core/distance'

/**
 * Looks up UK postcodes with postcodes.io, which is free and needs no key. Results are cached,
 * since postcodes don't move.
 */

const cache = new Map<string, Point | null>()

export async function lookupPostcode(input: string): Promise<Point | null> {
	const postcode = normalisePostcode(input)
	if (!postcode) return null
	if (cache.has(postcode)) return cache.get(postcode) ?? null
	try {
		const response = await fetch(
			`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`,
			{
				signal: AbortSignal.timeout(5000),
			},
		)
		if (response.status === 404) {
			cache.set(postcode, null)
			return null
		}
		if (!response.ok) return null
		const body = (await response.json()) as { result?: { latitude?: number; longitude?: number } }
		const { latitude, longitude } = body.result ?? {}
		const point =
			typeof latitude === 'number' && typeof longitude === 'number'
				? { lat: latitude, lng: longitude }
				: null
		cache.set(postcode, point)
		return point
	} catch {
		return null
	}
}
