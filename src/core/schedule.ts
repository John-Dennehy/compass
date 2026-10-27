import { addDays, dayOf, daysBetween, minutesOf } from './dates'
import type { Area, IsoDate, Listing, Occurrence, Session } from './listing'

/**
 * When things happen. The week view is the heart of Compass: for each day of a given week, every
 * regular session and one-off event on that day, with whether it's actually on.
 */

export type TermStatus =
	| { kind: 'term' }
	| { kind: 'holiday'; name: string }
	/** Outside the term dates we know about, so we can't say. */
	| { kind: 'unknown' }

/** Whether schools are in on a date, from the area's published term dates. */
export function termStatus(area: Pick<Area, 'terms'>, date: IsoDate): TermStatus {
	const terms = [...area.terms].sort((a, b) => a.start.localeCompare(b.start))
	const first = terms[0]
	const last = terms.at(-1)
	if (!first || !last || date < first.start || date > last.end) return { kind: 'unknown' }
	for (const term of terms) {
		if (date >= term.start && date <= term.end) {
			if (date >= term.halfTerm.start && date <= term.halfTerm.end) {
				return { kind: 'holiday', name: 'half term' }
			}
			return { kind: 'term' }
		}
	}
	const month = Number(date.slice(5, 7))
	const name =
		month >= 7 && month <= 9
			? 'the summer holidays'
			: month === 12 || month === 1
				? 'the Christmas holidays'
				: 'the Easter holidays'
	return { kind: 'holiday', name }
}

/** Whether a session's pattern (weekly, fortnightly, monthly) puts it on a date. */
export function runsOn(session: Session, date: IsoDate): 'yes' | 'no' {
	if (dayOf(date) !== session.day) return 'no'
	const { every } = session
	if (every.kind === 'week') return 'yes'
	if (every.kind === 'fortnight') {
		const gap = daysBetween(every.from, date)
		return gap % 14 === 0 ? 'yes' : 'no'
	}
	const dayOfMonth = Number(date.slice(8, 10))
	if (every.week === 'last') {
		return addDays(date, 7).slice(5, 7) !== date.slice(5, 7) ? 'yes' : 'no'
	}
	return Math.ceil(dayOfMonth / 7) === every.week ? 'yes' : 'no'
}

export type EntryStatus =
	| { kind: 'on' }
	| { kind: 'off'; reason: string }
	/** Probably on, but something needs checking first. */
	| { kind: 'check'; reason: string }

export interface Entry {
	listing: Listing
	date: IsoDate
	start?: string
	end?: string
	label?: string
	oneOff: boolean
	status: EntryStatus
}

function sessionStatus(session: Session, term: TermStatus): EntryStatus {
	if (!session.termTimeOnly) return { kind: 'on' }
	if (term.kind === 'holiday') return { kind: 'off', reason: `Not on in ${term.name}` }
	if (term.kind === 'unknown') {
		return { kind: 'check', reason: 'Term time only. Check it’s on before you go.' }
	}
	return { kind: 'on' }
}

/** Everything on a single date, in time order. */
export function entriesOn(listings: readonly Listing[], area: Area, date: IsoDate): Entry[] {
	const term = termStatus(area, date)
	const entries: Entry[] = []
	for (const listing of listings) {
		if (listing.when.kind === 'regular') {
			for (const session of listing.when.sessions) {
				if (runsOn(session, date) === 'no') continue
				entries.push({
					listing,
					date,
					start: session.start,
					end: session.end,
					label: session.label,
					oneOff: false,
					status: sessionStatus(session, term),
				})
			}
		} else {
			for (const occurrence of listing.when.dates) {
				if (occurrence.date !== date) continue
				entries.push({
					listing,
					date,
					start: occurrence.start,
					end: occurrence.end,
					oneOff: true,
					status: { kind: 'on' },
				})
			}
		}
	}
	return entries.sort(byTime)
}

function byTime(a: Entry, b: Entry): number {
	const time = (e: Entry) => (e.start ? minutesOf(e.start) : 24 * 60)
	return time(a) - time(b) || a.listing.name.localeCompare(b.listing.name)
}

export interface DayPlan {
	date: IsoDate
	term: TermStatus
	entries: Entry[]
}

/** Seven days from a Monday. */
export function planWeek(listings: readonly Listing[], area: Area, monday: IsoDate): DayPlan[] {
	return Array.from({ length: 7 }, (_, i) => {
		const date = addDays(monday, i)
		return { date, term: termStatus(area, date), entries: entriesOn(listings, area, date) }
	})
}

/** The next few times a listing is on, skipping holidays for term-time sessions. */
export function nextTimes(
	listing: Listing,
	area: Area,
	from: IsoDate,
	nowMinutes: number,
	count = 3,
): Entry[] {
	const found: Entry[] = []
	for (let i = 0; i < 120 && found.length < count; i++) {
		const date = addDays(from, i)
		for (const entry of entriesOn([listing], area, date)) {
			if (entry.status.kind === 'off') continue
			const finished = i === 0 && minutesOf(entry.end ?? entry.start ?? '23:59') <= nowMinutes
			if (!finished && found.length < count) found.push(entry)
		}
	}
	return found
}

/** One-off events from a date onwards, soonest first. */
export function upcomingEvents(
	listings: readonly Listing[],
	from: IsoDate,
	days: number,
): { listing: Listing; occurrence: Occurrence }[] {
	const until = addDays(from, days)
	return listings
		.flatMap((listing) =>
			listing.when.kind === 'one-off'
				? listing.when.dates
						.filter((o) => o.date >= from && o.date <= until)
						.map((occurrence) => ({ listing, occurrence }))
				: [],
		)
		.sort(
			(a, b) =>
				a.occurrence.date.localeCompare(b.occurrence.date) ||
				(a.occurrence.start ?? '99').localeCompare(b.occurrence.start ?? '99'),
		)
}

/** A one-off listing whose last date has gone is finished, and drops out of searches. */
export function isOver(listing: Listing, today: IsoDate): boolean {
	return listing.when.kind === 'one-off' && listing.when.dates.every((o) => o.date < today)
}
