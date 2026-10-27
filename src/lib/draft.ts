import type { Day, Details, DetailsInput, Session, SessionInput } from '@/core/listing'

/**
 * What the listing form holds while someone is filling it in: plain strings and booleans, so
 * every field can be half-typed. It becomes listing details only when they press send, and the
 * listing schema checks it then.
 */

export interface SessionDraft {
	day: Day
	start: string
	end: string
	label: string
	termTimeOnly: boolean
	every: 'week' | 'fortnight' | 'month'
	/** A date it ran on, for every other week. */
	from: string
	/** Which week of the month. */
	week: '1' | '2' | '3' | '4' | 'last'
}

export interface DateDraft {
	date: string
	start: string
	end: string
}

export interface Draft {
	kind: 'regular' | 'one-off'
	name: string
	category: string
	summary: string
	whoFor: string
	allAges: boolean
	from: string
	to: string
	expecting: boolean
	venueName: string
	address: string
	postcode: string
	town: string
	/** Kept from the existing listing, so an edit doesn't lose the map position. */
	lat?: number
	lng?: number
	approximate?: boolean
	sessions: SessionDraft[]
	dates: DateDraft[]
	costKind: 'free' | 'donation' | 'paid' | 'unknown'
	costNote: string
	contacts: { kind: 'phone' | 'text' | 'email'; value: string; name: string }[]
	links: { kind: 'website' | 'facebook' | 'instagram' | 'other'; url: string }[]
	notes: string
}

/** Ages offered in the form, in months. */
export const AGE_OPTIONS: { months: number; label: string }[] = [
	{ months: 0, label: 'Birth' },
	{ months: 6, label: '6 months' },
	{ months: 12, label: '1 year' },
	{ months: 18, label: '18 months' },
	{ months: 24, label: '2 years' },
	{ months: 36, label: '3 years' },
	{ months: 48, label: '4 years' },
	{ months: 60, label: '5 years' },
	{ months: 72, label: '6 years' },
	{ months: 84, label: '7 years' },
	{ months: 96, label: '8 years' },
	{ months: 132, label: '11 years' },
	{ months: 156, label: '13 years' },
	{ months: 192, label: '16 years' },
	{ months: 216, label: '18 years' },
]

export function emptySession(day: Day = 'monday'): SessionDraft {
	return {
		day,
		start: '',
		end: '',
		label: '',
		termTimeOnly: false,
		every: 'week',
		from: '',
		week: '1',
	}
}

export function emptyDraft(kind: Draft['kind'] = 'regular', town = ''): Draft {
	return {
		kind,
		name: '',
		category: '',
		summary: '',
		whoFor: '',
		allAges: false,
		from: '0',
		to: '60',
		expecting: false,
		venueName: '',
		address: '',
		postcode: '',
		town,
		sessions: [emptySession()],
		dates: [{ date: '', start: '', end: '' }],
		costKind: 'unknown',
		costNote: '',
		contacts: [],
		links: [],
		notes: '',
	}
}

const optional = (text: string) => (text.trim() ? text.trim() : undefined)

function toSession(s: SessionDraft): SessionInput {
	const every =
		s.every === 'fortnight'
			? { kind: 'fortnight' as const, from: s.from }
			: s.every === 'month'
				? {
						kind: 'month' as const,
						week: s.week === 'last' ? ('last' as const) : (Number(s.week) as 1 | 2 | 3 | 4),
					}
				: { kind: 'week' as const }
	return {
		day: s.day,
		start: s.start,
		end: optional(s.end),
		label: optional(s.label),
		termTimeOnly: s.termTimeOnly,
		every,
	}
}

export function toDetails(d: Draft): DetailsInput {
	return {
		name: d.name.trim(),
		category: d.category,
		summary: optional(d.summary),
		whoFor: d.whoFor.trim(),
		ages: d.allAges ? null : { from: Number(d.from), to: Number(d.to) },
		expecting: d.expecting,
		venue: {
			name: d.venueName.trim(),
			address: d.address.trim(),
			postcode: optional(d.postcode),
			town: d.town,
			lat: d.lat,
			lng: d.lng,
			approximate: d.approximate ?? false,
		},
		when:
			d.kind === 'regular'
				? { kind: 'regular', sessions: d.sessions.map(toSession) }
				: {
						kind: 'one-off',
						dates: d.dates.map((o) => ({
							date: o.date,
							start: optional(o.start),
							end: optional(o.end),
						})),
					},
		cost: { kind: d.costKind, note: optional(d.costNote) },
		contacts: d.contacts
			.filter((c) => c.value.trim())
			.map((c) => ({ kind: c.kind, value: c.value.trim(), name: optional(c.name) })),
		links: d.links.filter((l) => l.url.trim()).map((l) => ({ kind: l.kind, url: l.url.trim() })),
		notes: optional(d.notes),
	}
}

function fromSession(s: Session): SessionDraft {
	return {
		day: s.day,
		start: s.start,
		end: s.end ?? '',
		label: s.label ?? '',
		termTimeOnly: s.termTimeOnly,
		every: s.every.kind,
		from: s.every.kind === 'fortnight' ? s.every.from : '',
		week: s.every.kind === 'month' ? (String(s.every.week) as SessionDraft['week']) : '1',
	}
}

export function fromDetails(details: Details): Draft {
	const base = emptyDraft(details.when.kind, details.venue.town)
	return {
		...base,
		name: details.name,
		category: details.category,
		summary: details.summary ?? '',
		whoFor: details.whoFor,
		allAges: details.ages === null,
		from: String(details.ages?.from ?? 0),
		to: String(details.ages?.to ?? 60),
		expecting: details.expecting,
		venueName: details.venue.name,
		address: details.venue.address,
		postcode: details.venue.postcode ?? '',
		lat: details.venue.lat,
		lng: details.venue.lng,
		approximate: details.venue.approximate,
		sessions:
			details.when.kind === 'regular' ? details.when.sessions.map(fromSession) : base.sessions,
		dates:
			details.when.kind === 'one-off'
				? details.when.dates.map((o) => ({ date: o.date, start: o.start ?? '', end: o.end ?? '' }))
				: base.dates,
		costKind: details.cost.kind,
		costNote: details.cost.note ?? '',
		contacts: details.contacts.map((c) => ({ ...c, name: c.name ?? '' })),
		links: details.links,
		notes: details.notes ?? '',
	}
}
