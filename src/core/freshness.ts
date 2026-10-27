import { daysBetween, describeAgo } from './dates'
import type { ConfirmedBy, IsoDate, Listing } from './listing'

/**
 * How much to trust a listing right now. Listings are crowd-sourced, so the honest answer to
 * "is this still on?" is "someone confirmed it N weeks ago", and we say so on every listing.
 */

export const RECENT_DAYS = 90
export const STALE_DAYS = 180
/** Distinct people saying it has stopped before we warn everyone. */
export const STOPPED_WARNING = 2

export type FreshnessLevel = 'recent' | 'check' | 'stale'

export interface Freshness {
	level: FreshnessLevel
	days: number
	/** "Checked 2 weeks ago by the organiser". */
	label: string
	/** "Checked 2 weeks ago", for tight spaces. */
	short: string
	/** How many different people have said it stopped since it was last confirmed. */
	stoppedReports: number
	/** A plain warning when people say it has stopped. */
	warning: string | null
}

const WHO: Record<ConfirmedBy, string> = {
	source: 'from the council’s leaflet',
	visitor: 'by someone who went',
	contributor: 'by a contributor',
	organiser: 'by the organiser',
	moderator: 'by a moderator',
}

export function freshness(
	listing: Pick<Listing, 'lastConfirmedAt' | 'lastConfirmedBy'>,
	today: IsoDate,
	stoppedReports = 0,
): Freshness {
	const confirmed = listing.lastConfirmedAt.slice(0, 10)
	const days = Math.max(0, daysBetween(confirmed, today))
	const level: FreshnessLevel =
		days <= RECENT_DAYS ? 'recent' : days <= STALE_DAYS ? 'check' : 'stale'
	const ago = describeAgo(confirmed, today)
	const when = /\d{4}$/.test(ago) ? `in ${ago}` : ago
	const label =
		listing.lastConfirmedBy === 'source'
			? `Last checked ${when}, ${WHO.source}`
			: `Checked ${when} ${WHO[listing.lastConfirmedBy]}`
	const short = /\d{4}$/.test(ago) ? `Last checked ${ago}` : `Checked ${ago}`
	const warning =
		stoppedReports >= STOPPED_WARNING
			? `${stoppedReports} people have said this has stopped. Check before you go.`
			: stoppedReports === 1
				? 'Someone said this may have stopped. Check before you go.'
				: null
	return { level, days, label, short, stoppedReports, warning }
}

/** Fresh listings first, and ones people say have stopped last. Used for search results, never for the week's time order. */
export function byFreshness(a: Freshness, b: Freshness): number {
	const rank = { recent: 0, check: 1, stale: 2 }
	return rank[a.level] - rank[b.level] || a.stoppedReports - b.stoppedReports
}
