import { pgTable, text, timestamp, jsonb, uuid, pgEnum } from 'drizzle-orm/pg-core';

export const statusEnum = pgEnum('status', ['pending', 'approved', 'rejected']);

export const resources = pgTable('resources', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(), // playgroup | library | other
  audiences: jsonb('audiences').$type<string[]>().notNull(),
  tags: jsonb('tags').$type<string[]>(),
  location: jsonb('location').$type<{
    name: string;
    address: string;
    postcode?: string;
    latitude?: number;
    longitude?: number;
  }>().notNull(),
  schedule: jsonb('schedule').$type<{
    day: string;
    times: { startTime: string; endTime: string; description?: string }[];
    frequency?: string;
    notes?: string;
  }[]>().notNull(),
  contacts: jsonb('contacts').$type<{
    method: string;
    value: string;
    description?: string;
  }[]>(),
  links: jsonb('links').$type<{
    type: string;
    url: string;
    description?: string;
  }[]>(),
  notes: text('notes'),
  status: statusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
