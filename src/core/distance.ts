/** Straight-line distance, which is good enough to sort places a short drive or walk away. */

export interface Point {
	lat: number
	lng: number
}

const EARTH_MILES = 3958.8

export function milesBetween(a: Point, b: Point): number {
	const rad = (deg: number) => (deg * Math.PI) / 180
	const dLat = rad(b.lat - a.lat)
	const dLng = rad(b.lng - a.lng)
	const h =
		Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
	return 2 * EARTH_MILES * Math.asin(Math.sqrt(h))
}

/** "0.3 miles", "2 miles". */
export function describeMiles(miles: number): string {
	if (miles < 0.1) return 'Under 0.1 miles'
	if (miles < 1) return `${miles.toFixed(1)} miles`
	const rounded = miles < 10 ? Math.round(miles * 2) / 2 : Math.round(miles)
	return `${rounded} mile${rounded === 1 ? '' : 's'}`
}

export function normalisePostcode(input: string): string | null {
	const compact = input.toUpperCase().replace(/\s+/g, '')
	if (!/^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(compact)) return null
	return `${compact.slice(0, -3)} ${compact.slice(-3)}`
}
