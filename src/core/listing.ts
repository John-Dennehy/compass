import { z } from 'zod'

/**
 * The shape of everything Compass lists. A listing is either a regular session that repeats
 * each week (or fortnight, or month), or a one-off event on particular dates. Both live in the
 * same table, belong to an area and a category, and go through the same checks.
 */

export const DAYS = [
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
	'sunday',
] as const
export type Day = (typeof DAYS)[number]

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date like 2026-11-02')
export type IsoDate = z.infer<typeof isoDate>

export const clockTime = z
	.string()
	.regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use a 24-hour time like 09:30')
export type ClockTime = z.infer<typeof clockTime>

const text = (max: number) => z.string().trim().min(1).max(max)

export const sessionSchema = z
	.object({
		day: z.enum(DAYS),
		start: clockTime,
		end: clockTime.optional(),
		/** For a group that splits, like "babies" and "confident movers". */
		label: text(60).optional(),
		termTimeOnly: z.boolean().default(false),
		/** How often it runs. Fortnightly needs one date it ran on; monthly needs which week. */
		every: z
			.discriminatedUnion('kind', [
				z.object({ kind: z.literal('week') }),
				z.object({ kind: z.literal('fortnight'), from: isoDate }),
				z.object({
					kind: z.literal('month'),
					week: z.union([
						z.literal(1),
						z.literal(2),
						z.literal(3),
						z.literal(4),
						z.literal('last'),
					]),
				}),
			])
			.default({ kind: 'week' }),
	})
	.refine((s) => !s.end || s.end > s.start, { message: 'It has to finish after it starts' })
export type Session = z.infer<typeof sessionSchema>

export const occurrenceSchema = z
	.object({
		date: isoDate,
		start: clockTime.optional(),
		end: clockTime.optional(),
	})
	.refine((o) => !o.end || !o.start || o.end > o.start, {
		message: 'It has to finish after it starts',
	})
export type Occurrence = z.infer<typeof occurrenceSchema>

export const whenSchema = z.discriminatedUnion('kind', [
	z.object({ kind: z.literal('regular'), sessions: z.array(sessionSchema).min(1).max(21) }),
	z.object({ kind: z.literal('one-off'), dates: z.array(occurrenceSchema).min(1).max(30) }),
])
export type When = z.infer<typeof whenSchema>

/** Ages in months, so "under 2s" and "2 to 5 years" can be compared. `to` is exclusive. */
export const agesSchema = z
	.object({
		from: z.number().int().min(0).max(1200),
		to: z.number().int().min(1).max(1200),
	})
	.refine((a) => a.to > a.from, { message: 'The upper age has to be above the lower one' })
export type Ages = z.infer<typeof agesSchema>

export const venueSchema = z.object({
	name: text(120),
	address: text(200),
	postcode: z
		.string()
		.trim()
		.toUpperCase()
		.regex(/^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/, 'That doesn’t look like a UK postcode')
		.optional(),
	town: text(60),
	lat: z.number().min(-90).max(90).optional(),
	lng: z.number().min(-180).max(180).optional(),
	/** True when the map position is a guess, not looked up from the postcode. */
	approximate: z.boolean().default(false),
})
export type Venue = z.infer<typeof venueSchema>

export const costSchema = z.object({
	kind: z.enum(['free', 'donation', 'paid', 'unknown']),
	note: text(120).optional(),
})
export type Cost = z.infer<typeof costSchema>

const safeUrl = z
	.string()
	.trim()
	.transform((u) => (/^https?:\/\//i.test(u) ? u : `https://${u}`))
	.pipe(z.url({ protocol: /^https?$/ }))

export const contactSchema = z.object({
	kind: z.enum(['phone', 'text', 'email']),
	value: text(120),
	name: text(60).optional(),
})
export type Contact = z.infer<typeof contactSchema>

export const linkSchema = z.object({
	kind: z.enum(['website', 'facebook', 'instagram', 'other']),
	url: safeUrl,
})
export type Link = z.infer<typeof linkSchema>

/** Everything a contributor can propose a change to. */
export const detailsSchema = z.object({
	name: text(120),
	category: z.string().regex(/^[a-z0-9-]{2,40}$/),
	summary: text(400).optional(),
	/** Who it's for, in the organiser's words, like "0 to 4 years" or "expectant parents". */
	whoFor: text(120),
	ages: agesSchema.nullable(),
	expecting: z.boolean().default(false),
	venue: venueSchema,
	when: whenSchema,
	cost: costSchema.default({ kind: 'unknown' }),
	contacts: z.array(contactSchema).max(5).default([]),
	links: z.array(linkSchema).max(5).default([]),
	notes: text(500).optional(),
})
export type Details = z.infer<typeof detailsSchema>
export type DetailsInput = z.input<typeof detailsSchema>

export const DETAIL_FIELDS = [
	'name',
	'category',
	'summary',
	'whoFor',
	'ages',
	'expecting',
	'venue',
	'when',
	'cost',
	'contacts',
	'links',
	'notes',
] as const satisfies readonly (keyof Details)[]
export type DetailField = (typeof DETAIL_FIELDS)[number]

export const FIELD_NAMES: Record<DetailField, string> = {
	name: 'name',
	category: 'kind of thing',
	summary: 'description',
	whoFor: 'who it’s for',
	ages: 'ages',
	expecting: 'expectant parents',
	venue: 'place',
	when: 'days and times',
	cost: 'cost',
	contacts: 'contact details',
	links: 'links',
	notes: 'notes',
}

/** Who last confirmed a listing is still right. */
export const confirmedBySchema = z.enum([
	'source',
	'visitor',
	'contributor',
	'organiser',
	'moderator',
])
export type ConfirmedBy = z.infer<typeof confirmedBySchema>

export const listingSchema = detailsSchema.extend({
	id: z.string().min(1),
	slug: z.string().regex(/^[a-z0-9-]{1,100}$/),
	areaId: z.string().min(1),
	status: z.enum(['published', 'hidden']),
	version: z.number().int().min(1),
	/** An organiser has claimed this listing and keeps it up to date. */
	verified: z.boolean(),
	lastConfirmedAt: z.iso.datetime(),
	lastConfirmedBy: confirmedBySchema,
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
})
export type Listing = z.infer<typeof listingSchema>

export const termSchema = z.object({
	name: text(40),
	start: isoDate,
	end: isoDate,
	halfTerm: z.object({ start: isoDate, end: isoDate }),
})
export type Term = z.infer<typeof termSchema>

export const areaSchema = z.object({
	id: z.string().regex(/^[a-z0-9-]{2,40}$/),
	name: text(60),
	region: text(60),
	towns: z.array(text(60)).min(1),
	centre: z.object({ lat: z.number(), lng: z.number() }),
	terms: z.array(termSchema),
	termSource: z.object({ name: text(120), url: z.url() }),
})
export type Area = z.infer<typeof areaSchema>

export const categorySchema = z.object({
	slug: z.string().regex(/^[a-z0-9-]{2,40}$/),
	name: text(60),
	description: text(200),
})
export type Category = z.infer<typeof categorySchema>

/** "Butterflies Toddler Group" at "Salvation Army" → "butterflies-toddler-group-salvation-army". */
export function slugify(...parts: string[]): string {
	return parts
		.join(' ')
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/&/g, ' and ')
		.replace(/@/g, ' at ')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 100)
		.replace(/-+$/, '')
}
