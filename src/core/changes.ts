import {
	DETAIL_FIELDS,
	type DetailField,
	type Details,
	detailsSchema,
	FIELD_NAMES,
} from './listing'

/**
 * Suggested changes are stored as just the fields that differ, so a moderator sees exactly what
 * someone wants to change, and two people changing different fields don't undo each other.
 */

export type Changes = { [K in DetailField]?: Details[K] | null }

/** Fields that can be left out. In stored changes, null means "remove it". */
const OPTIONAL: readonly DetailField[] = ['summary', 'notes']

function same(a: unknown, b: unknown): boolean {
	return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}

/** The fields of `proposed` that differ from `current`. */
export function diffDetails(current: Details, proposed: Details): Changes {
	const changes: Record<string, unknown> = {}
	for (const field of DETAIL_FIELDS) {
		if (!same(current[field], proposed[field])) changes[field] = proposed[field] ?? null
	}
	return changes as Changes
}

export function changedFields(changes: Changes): DetailField[] {
	return DETAIL_FIELDS.filter((f) => f in changes)
}

/** Applies changes and checks the result is still a valid listing. */
export function applyChanges(current: Details, changes: Changes): Details {
	const next: Record<string, unknown> = { ...current }
	for (const field of changedFields(changes)) {
		const value = changes[field]
		if (value === undefined || (value === null && OPTIONAL.includes(field))) delete next[field]
		else next[field] = value
	}
	return detailsSchema.parse(next)
}

/** "days and times, and cost". */
export function describeChanges(changes: Changes): string {
	const names = changedFields(changes).map((f) => FIELD_NAMES[f])
	if (names.length <= 1) return names[0] ?? 'nothing'
	return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
}

/** Fields both sides changed since a suggestion was made, which a moderator should look at. */
export function conflicts(sinceBase: Changes, suggested: Changes): DetailField[] {
	const touched = new Set(changedFields(sinceBase))
	return changedFields(suggested).filter((f) => touched.has(f))
}

/** Picks the details out of a full listing. */
export function detailsOf(listing: Details): Details {
	const out: Record<string, unknown> = {}
	for (const field of DETAIL_FIELDS) if (listing[field] !== undefined) out[field] = listing[field]
	return detailsSchema.parse(out)
}
