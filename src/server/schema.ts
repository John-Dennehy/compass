import {
	index,
	integer,
	jsonb,
	pgTable,
	primaryKey,
	serial,
	text,
	timestamp,
	uniqueIndex,
} from 'drizzle-orm/pg-core'
import type { Changes } from '@/core/changes'
import type { Area, Details, Listing } from '@/core/listing'

/**
 * Listings are stored whole as JSON, checked by the same zod schema the browser uses, with the
 * columns we query on pulled out. Every change to a listing adds a revision, so the history is
 * complete and a bad edit can be undone.
 */

export const areas = pgTable('areas', {
	id: text('id').primaryKey(),
	data: jsonb('data').$type<Area>().notNull(),
})

export const categories = pgTable('categories', {
	slug: text('slug').primaryKey(),
	name: text('name').notNull(),
	description: text('description').notNull(),
	position: integer('position').notNull().default(0),
})

export const listings = pgTable(
	'listings',
	{
		id: text('id').primaryKey(),
		slug: text('slug').notNull(),
		areaId: text('area_id')
			.notNull()
			.references(() => areas.id),
		status: text('status', { enum: ['published', 'hidden'] }).notNull(),
		version: integer('version').notNull(),
		data: jsonb('data').$type<Listing>().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
	},
	(t) => [uniqueIndex('listings_slug').on(t.slug), index('listings_area').on(t.areaId, t.status)],
)

export const revisions = pgTable(
	'revisions',
	{
		id: serial('id').primaryKey(),
		listingId: text('listing_id')
			.notNull()
			.references(() => listings.id, { onDelete: 'cascade' }),
		version: integer('version').notNull(),
		details: jsonb('details').$type<Details>().notNull(),
		changes: jsonb('changes').$type<Changes>().notNull(),
		by: text('by', { enum: ['source', 'contributor', 'organiser', 'moderator'] }).notNull(),
		contributorId: text('contributor_id'),
		note: text('note'),
		at: timestamp('at', { withTimezone: true }).notNull(),
	},
	(t) => [uniqueIndex('revisions_version').on(t.listingId, t.version)],
)

export const confirmations = pgTable(
	'confirmations',
	{
		id: serial('id').primaryKey(),
		listingId: text('listing_id')
			.notNull()
			.references(() => listings.id, { onDelete: 'cascade' }),
		kind: text('kind', { enum: ['running', 'stopped'] }).notNull(),
		visitorId: text('visitor_id').notNull(),
		at: timestamp('at', { withTimezone: true }).notNull(),
	},
	(t) => [index('confirmations_listing').on(t.listingId, t.at)],
)

export const contributors = pgTable('contributors', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	name: text('name'),
	approved: integer('approved').notNull().default(0),
	rejected: integer('rejected').notNull().default(0),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
})

export const organisers = pgTable(
	'organisers',
	{
		listingId: text('listing_id')
			.notNull()
			.references(() => listings.id, { onDelete: 'cascade' }),
		contributorId: text('contributor_id')
			.notNull()
			.references(() => contributors.id, { onDelete: 'cascade' }),
	},
	(t) => [primaryKey({ columns: [t.listingId, t.contributorId] })],
)

export const suggestions = pgTable(
	'suggestions',
	{
		id: text('id').primaryKey(),
		kind: text('kind', { enum: ['new', 'change', 'claim'] }).notNull(),
		areaId: text('area_id').notNull(),
		listingId: text('listing_id'),
		baseVersion: integer('base_version'),
		/** The whole listing for a new one, or only the changed fields for a change. */
		changes: jsonb('changes').$type<Changes>().notNull(),
		message: text('message'),
		contributorId: text('contributor_id')
			.notNull()
			.references(() => contributors.id, { onDelete: 'cascade' }),
		priority: integer('priority').notNull(),
		status: text('status', { enum: ['pending', 'approved', 'rejected'] }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
		reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
		reviewedBy: text('reviewed_by'),
		reviewNote: text('review_note'),
	},
	(t) => [
		index('suggestions_status').on(t.status, t.priority, t.createdAt),
		index('suggestions_contributor').on(t.contributorId, t.createdAt),
	],
)

export const signInTokens = pgTable('sign_in_tokens', {
	tokenHash: text('token_hash').primaryKey(),
	email: text('email').notNull(),
	name: text('name'),
	next: text('next').notNull(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
})
