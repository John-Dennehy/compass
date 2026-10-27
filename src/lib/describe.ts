import { dayName, describeDate, describeTimes } from '@/core/dates'
import { describeAges } from '@/core/filters'
import {
	type Category,
	DAYS,
	type DetailField,
	type Details,
	type Listing,
	type Session,
	type Venue,
} from '@/core/listing'

/** "Mondays, Wednesdays and Thursdays, 10am to 12pm", one line per different time. */
export function describeSessions(listing: Pick<Listing, 'when'>, today: string): string[] {
	if (listing.when.kind === 'one-off') {
		return listing.when.dates.map(
			(o) => `${describeDate(o.date, today)}, ${describeTimes(o.start, o.end).toLowerCase()}`,
		)
	}
	const groups = new Map<string, Session[]>()
	for (const s of listing.when.sessions) {
		const key = `${s.start}|${s.end ?? ''}|${s.label ?? ''}|${JSON.stringify(s.every)}`
		groups.set(key, [...(groups.get(key) ?? []), s])
	}
	return [...groups.values()].map((sessions) => {
		const first = sessions[0] as Session
		const days = sessions.map((s) => s.day).sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b))
		const list = (names: string[]) =>
			names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : (names[0] ?? '')
		const { every } = first
		const when =
			every.kind === 'fortnight'
				? `Every other ${list(days.map(dayName))}`
				: every.kind === 'month'
					? `The ${every.week === 'last' ? 'last' : ['first', 'second', 'third', 'fourth'][every.week - 1]} ${list(days.map(dayName))} of the month`
					: list(days.map((d) => `${dayName(d)}s`))
		const label = first.label ? ` (${first.label.toLowerCase()})` : ''
		return `${when}, ${describeTimes(first.start, first.end).toLowerCase()}${label}`
	})
}

export function hasTermTimeOnly(listing: Listing): boolean {
	return listing.when.kind === 'regular' && listing.when.sessions.some((s) => s.termTimeOnly)
}

function place(venue: Venue): string {
	return [venue.name, venue.address, venue.postcode].filter(Boolean).join(', ')
}

/** Opens the place in Google Maps, which most people already have on their phone. */
export function mapsUrl(venue: Venue): string {
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place(venue))}`
}

export function directionsUrl(venue: Venue): string {
	return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place(venue))}`
}

export function costLabel(listing: Pick<Listing, 'cost'>): string | null {
	const { kind, note } = listing.cost
	const base = { free: 'Free', donation: 'Donation', paid: 'Paid', unknown: null }[kind]
	if (!base) return note ?? null
	return note ? `${base}: ${note}` : base
}

/** A field's value in words, for showing a moderator what a suggestion changes. */
export function describeField(
	field: DetailField,
	details: Details,
	today: string,
	categories: Category[],
): string {
	switch (field) {
		case 'category':
			return categories.find((c) => c.slug === details.category)?.name ?? details.category
		case 'ages':
			return describeAges({ ages: details.ages, expecting: false })
		case 'expecting':
			return details.expecting ? 'Yes' : 'No'
		case 'venue':
			return [details.venue.name, details.venue.address, details.venue.postcode, details.venue.town]
				.filter(Boolean)
				.join(', ')
		case 'when':
			return describeSessions(details, today).join('. ')
		case 'cost':
			return costLabel(details) ?? 'Not known'
		case 'contacts':
			return (
				details.contacts
					.map((c) => `${c.kind}: ${c.value}${c.name ? ` (${c.name})` : ''}`)
					.join(', ') || 'None'
			)
		case 'links':
			return details.links.map((l) => l.url).join(', ') || 'None'
		default:
			return details[field] ?? 'Nothing'
	}
}
