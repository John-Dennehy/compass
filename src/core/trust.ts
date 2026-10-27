/**
 * Who can change what. Anyone can say a listing is still on or has stopped. Signed-in
 * contributors can suggest new listings and changes, which a moderator reviews. Organisers
 * keep their own listing up to date directly, and contributors with a good record go to the
 * front of the queue. Nobody's change is lost: every applied change is kept in the history.
 */

export type Role = 'contributor' | 'moderator'

export interface ContributorRecord {
	role: Role
	approved: number
	rejected: number
	/** Listings this person has claimed as the organiser. */
	organiserOf: readonly string[]
}

export type Trust = 'moderator' | 'organiser' | 'trusted' | 'new'

export const TRUSTED_AFTER = 3

export function trustFor(person: ContributorRecord, listingId?: string): Trust {
	if (person.role === 'moderator') return 'moderator'
	if (listingId && person.organiserOf.includes(listingId)) return 'organiser'
	// A good record: a few approved, and at most one rejected in every five.
	if (person.approved >= TRUSTED_AFTER && person.rejected * 5 <= person.approved) return 'trusted'
	return 'new'
}

export type SuggestionKind = 'new' | 'change' | 'claim'

/** Whether a suggestion goes straight on, or to the queue. */
export function routeSuggestion(kind: SuggestionKind, trust: Trust): 'apply' | 'queue' {
	if (trust === 'moderator') return kind === 'claim' ? 'queue' : 'apply'
	if (trust === 'organiser' && kind === 'change') return 'apply'
	return 'queue'
}

/** Lower comes first in the queue. */
export function queuePriority(trust: Trust): number {
	return trust === 'trusted' || trust === 'organiser' ? 0 : 1
}

export const LIMITS = {
	/** New contributors can have this many suggestions waiting at once. */
	newPending: 3,
	/** Nobody can send more than this in a day. */
	perDay: 10,
	/** Days before the same visitor can confirm the same listing again. */
	confirmEveryDays: 7,
}

export function checkLimits(
	trust: Trust,
	counts: { pending: number; lastDay: number },
): string | null {
	if (trust === 'moderator') return null
	if (counts.lastDay >= LIMITS.perDay) {
		return 'That’s a lot of suggestions for one day. Thank you! Please try again tomorrow.'
	}
	if (trust === 'new' && counts.pending >= LIMITS.newPending) {
		return `You have ${counts.pending} suggestions waiting to be checked. Once a moderator has looked at them you can send more.`
	}
	return null
}

/** Rough signs of spam in free text: lots of links, or the same character over and over. */
export function looksLikeSpam(text: string): boolean {
	const links = text.match(/https?:\/\/|www\./gi)?.length ?? 0
	return links > 3 || /(.)\1{14,}/.test(text)
}
