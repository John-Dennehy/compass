import { createServerFn } from '@tanstack/react-start'
import { deleteCookie, getCookie, getRequestUrl, setCookie } from '@tanstack/react-start/server'
import { z } from 'zod'
import { detailsOf } from '@/core/changes'
import type { DetailsInput, Listing } from '@/core/listing'
import {
	hashToken,
	isModerator,
	LINK_MINUTES,
	makeSession,
	makeToken,
	normaliseEmail,
	readSession,
	safeNext,
	sendSignInLink,
} from './auth'
import { lookupPostcode } from './postcodes'
import * as service from './service'
import { getStore } from './store'

/**
 * The server functions the pages call. Each one works out who is asking from cookies, then
 * hands over to the service, where the rules live.
 */

const VISITOR = 'compass_visitor'
const SESSION = 'compass_session'
const ID = /^[0-9a-f-]{36}$/

function cookieOptions(days: number) {
	return {
		httpOnly: true,
		sameSite: 'lax' as const,
		secure: process.env.NODE_ENV === 'production',
		path: '/',
		maxAge: days * 24 * 60 * 60,
	}
}

async function currentActor(): Promise<service.Actor> {
	let visitorId = getCookie(VISITOR)
	if (!visitorId || !ID.test(visitorId)) {
		visitorId = crypto.randomUUID()
		setCookie(VISITOR, visitorId, cookieOptions(400))
	}
	const store = getStore()
	const contributorId = readSession(getCookie(SESSION), new Date())
	const contributor = contributorId ? await store.contributor(contributorId) : null
	return {
		// Signed-in people are counted once, whichever device they use.
		visitorId: contributor ? `contributor:${contributor.id}` : visitorId,
		contributor,
		moderator: contributor ? isModerator(contributor.email) : false,
		organiserOf: contributor ? await store.organiserOf(contributor.id) : [],
	}
}

export const getMe = createServerFn({ method: 'GET' }).handler(async () => {
	const actor = await currentActor()
	if (!actor.contributor) return null
	return {
		name: actor.contributor.name,
		email: actor.contributor.email,
		moderator: actor.moderator,
		trust: service.trustOf(actor),
	}
})

export const getAreaData = createServerFn({ method: 'GET' })
	.validator(z.object({ area: z.string().max(40).optional() }))
	.handler(async ({ data }) => service.areaData(getStore(), data.area, new Date()))

export const getListingPage = createServerFn({ method: 'GET' })
	.validator(z.object({ slug: z.string().max(120) }))
	.handler(async ({ data }) =>
		service.listingPage(getStore(), data.slug, await currentActor(), new Date()),
	)

export const getListingHistory = createServerFn({ method: 'GET' })
	.validator(z.object({ slug: z.string().max(120) }))
	.handler(async ({ data }) => service.listingHistory(getStore(), data.slug, await currentActor()))

export const confirmListing = createServerFn({ method: 'POST' })
	.validator(z.object({ listingId: z.string().max(120), kind: z.enum(['running', 'stopped']) }))
	.handler(async ({ data }) => service.confirm(getStore(), await currentActor(), data, new Date()))

/** Fills in the map position from the postcode, when it's new or we only had a guess. */
async function placeVenue(details: DetailsInput, current?: Listing): Promise<DetailsInput> {
	const venue = details.venue
	if (!venue.postcode)
		return { ...details, venue: { ...venue, lat: undefined, lng: undefined, approximate: false } }
	const unchanged = current?.venue.postcode === venue.postcode && current.venue.lat !== undefined
	if (unchanged && current) {
		return {
			...details,
			venue: {
				...venue,
				lat: current.venue.lat,
				lng: current.venue.lng,
				approximate: current.venue.approximate,
			},
		}
	}
	const point = await lookupPostcode(venue.postcode)
	return { ...details, venue: { ...venue, lat: point?.lat, lng: point?.lng, approximate: false } }
}

// The forms send the details unchecked; the service checks them with the listing schema.
const detailsInput = z.custom<DetailsInput>((value) => typeof value === 'object' && value !== null)
/** A field people never see. Bots fill it in. */
const honeypot = z.string().max(200).optional()

export const suggestNewListing = createServerFn({ method: 'POST' })
	.validator(
		z.object({
			areaId: z.string().max(40),
			details: detailsInput,
			message: z.string().max(1000).optional(),
			organiser: z.boolean().optional(),
			website: honeypot,
		}),
	)
	.handler(async ({ data }) => {
		if (data.website) return { ok: true as const, status: 'queued' as const }
		const details = await placeVenue(data.details)
		return service.suggestNew(getStore(), await currentActor(), { ...data, details }, new Date())
	})

export const suggestListingChange = createServerFn({ method: 'POST' })
	.validator(
		z.object({
			listingId: z.string().max(120),
			baseVersion: z.number().int().min(1),
			details: detailsInput,
			message: z.string().max(1000).optional(),
			website: honeypot,
		}),
	)
	.handler(async ({ data }) => {
		if (data.website) return { ok: true as const, status: 'queued' as const }
		const current = await getStore().listing(data.listingId)
		const details = await placeVenue(data.details, current ?? undefined)
		return service.suggestChange(getStore(), await currentActor(), { ...data, details }, new Date())
	})

export const claimListing = createServerFn({ method: 'POST' })
	.validator(
		z.object({
			listingId: z.string().max(120),
			message: z.string().trim().min(10).max(1000),
			website: honeypot,
		}),
	)
	.handler(async ({ data }) => {
		if (data.website) return { ok: true as const }
		return service.claimListing(getStore(), await currentActor(), data, new Date())
	})

export const getMySuggestions = createServerFn({ method: 'GET' }).handler(async () =>
	service.mySuggestions(getStore(), await currentActor()),
)

export const getModerationQueue = createServerFn({ method: 'GET' }).handler(async () =>
	service.moderationQueue(getStore(), await currentActor(), new Date()),
)

export const reviewSuggestion = createServerFn({ method: 'POST' })
	.validator(
		z.object({
			id: z.string().max(60),
			decision: z.enum(['approve', 'reject']),
			note: z.string().max(500).optional(),
		}),
	)
	.handler(async ({ data }) =>
		service.reviewSuggestion(getStore(), await currentActor(), data, new Date()),
	)

export const setListingHidden = createServerFn({ method: 'POST' })
	.validator(
		z.object({
			listingId: z.string().max(120),
			hidden: z.boolean(),
			note: z.string().max(500).optional(),
		}),
	)
	.handler(async ({ data }) =>
		service.setHidden(getStore(), await currentActor(), data, new Date()),
	)

/** Moderators: replace guessed map positions with ones looked up from each postcode. */
export const refreshMapPositions = createServerFn({ method: 'POST' }).handler(async () => {
	const actor = await currentActor()
	if (!actor.moderator || !actor.contributor)
		return { ok: false as const, message: 'Only moderators can do that.' }
	const store = getStore()
	let updated = 0
	let missed = 0
	for (const area of await store.areas()) {
		for (const listing of await store.listings(area.id, true)) {
			if (!listing.venue.approximate || !listing.venue.postcode) continue
			const point = await lookupPostcode(listing.venue.postcode)
			if (!point) {
				missed++
				continue
			}
			const at = new Date().toISOString()
			const next: Listing = {
				...listing,
				venue: { ...listing.venue, ...point, approximate: false },
				version: listing.version + 1,
				updatedAt: at,
			}
			const saved = await store.updateListing(next, listing.version, {
				listingId: next.id,
				version: next.version,
				details: detailsOf(next),
				changes: { venue: next.venue },
				by: 'moderator',
				contributorId: actor.contributor.id,
				note: 'Map position looked up from the postcode.',
				at,
			})
			if (saved) updated++
		}
	}
	return { ok: true as const, updated, missed }
})

export const lookupNear = createServerFn({ method: 'GET' })
	.validator(z.object({ postcode: z.string().max(10) }))
	.handler(async ({ data }) => lookupPostcode(data.postcode))

function siteUrl(): string {
	if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '')
	const url = getRequestUrl()
	return `${url.protocol}//${url.host}`
}

export const requestSignIn = createServerFn({ method: 'POST' })
	.validator(
		z.object({
			email: z.email().max(200),
			name: z.string().trim().max(60).optional(),
			next: z.string().max(300).optional(),
		}),
	)
	.handler(async ({ data }) => {
		const { token, hash } = makeToken()
		await getStore().saveToken({
			tokenHash: hash,
			email: normaliseEmail(data.email),
			name: data.name || null,
			next: safeNext(data.next),
			expiresAt: new Date(Date.now() + LINK_MINUTES * 60 * 1000).toISOString(),
		})
		const result = await sendSignInLink(
			normaliseEmail(data.email),
			`${siteUrl()}/sign-in/check?token=${token}`,
		)
		if ('error' in result) return { ok: false as const, message: result.error }
		return { ok: true as const, link: 'link' in result ? result.link : null }
	})

export const completeSignIn = createServerFn({ method: 'POST' })
	.validator(z.object({ token: z.string().max(100) }))
	.handler(async ({ data }) => {
		const store = getStore()
		const now = new Date()
		const token = await store.takeToken(hashToken(data.token), now)
		if (!token)
			return { ok: false as const, message: 'That link has expired or has already been used.' }
		let contributor = await store.contributorByEmail(token.email)
		if (!contributor) {
			await store.createContributor({
				id: crypto.randomUUID(),
				email: token.email,
				name: token.name,
				approved: 0,
				rejected: 0,
				createdAt: now.toISOString(),
			})
			contributor = await store.contributorByEmail(token.email)
		}
		if (!contributor)
			return { ok: false as const, message: 'Something went wrong. Please try again.' }
		setCookie(SESSION, makeSession(contributor.id, now), cookieOptions(60))
		return { ok: true as const, next: token.next }
	})

export const signOut = createServerFn({ method: 'POST' }).handler(async () => {
	deleteCookie(SESSION, { path: '/' })
	return { ok: true as const }
})
