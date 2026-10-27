import { z } from 'zod'
import { filtersSchema } from '@/core/filters'

/** The query string shared by the week, coming up and search pages. */
export const searchSchema = filtersSchema.extend({
	area: z.string().max(40).optional(),
})

export const weekSearchSchema = searchSchema.extend({
	/** Weeks from this one: 0 is this week, 1 is next week. */
	week: z.number().int().min(-1).max(26).optional(),
})

export const findSearchSchema = searchSchema.extend({
	near: z.string().max(10).optional(),
	view: z.enum(['list', 'map']).optional(),
})
