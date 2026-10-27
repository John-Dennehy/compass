import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * Sign-in by email link: no passwords to keep safe. A signed cookie remembers who you are.
 * Moderators are the email addresses listed in MODERATOR_EMAILS, checked on every request, so
 * taking someone off the list takes effect straight away.
 */

export const SESSION_DAYS = 60
export const LINK_MINUTES = 30

let devSecret: string | undefined

function secret(): string {
	const configured = process.env.SESSION_SECRET
	if (configured && configured.length >= 32) return configured
	if (process.env.NODE_ENV === 'production' && !process.env.COMPASS_ALLOW_DEV_SECRET) {
		throw new Error('SESSION_SECRET must be set to at least 32 characters')
	}
	// Locally, a secret that lasts as long as the server does is enough.
	devSecret ??= randomBytes(32).toString('hex')
	return devSecret
}

const sign = (payload: string) => createHmac('sha256', secret()).update(payload).digest('base64url')

export function makeSession(contributorId: string, now: Date): string {
	const payload = Buffer.from(
		JSON.stringify({ c: contributorId, e: now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000 }),
	).toString('base64url')
	return `${payload}.${sign(payload)}`
}

/** The contributor id in a session cookie, if it's genuine and in date. */
export function readSession(cookie: string | undefined, now: Date): string | null {
	if (!cookie) return null
	const [payload, signature] = cookie.split('.')
	if (!payload || !signature) return null
	const expected = Buffer.from(sign(payload))
	const given = Buffer.from(signature)
	if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
	try {
		const { c, e } = JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
			c: unknown
			e: unknown
		}
		if (typeof c !== 'string' || typeof e !== 'number' || e < now.getTime()) return null
		return c
	} catch {
		return null
	}
}

export function makeToken(): { token: string; hash: string } {
	const token = randomBytes(32).toString('base64url')
	return { token, hash: hashToken(token) }
}

export function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex')
}

export function normaliseEmail(email: string): string {
	return email.trim().toLowerCase()
}

export function isModerator(email: string): boolean {
	const list = (process.env.MODERATOR_EMAILS ?? '').split(',').map(normaliseEmail).filter(Boolean)
	return list.includes(normaliseEmail(email))
}

/** Only ever send people back to a page on this site. */
export function safeNext(next: string | undefined): string {
	if (!next?.startsWith('/') || next.startsWith('//') || next.includes('\\')) return '/'
	return next.slice(0, 300)
}

export type SendResult =
	| { sent: true }
	| { sent: false; link: string }
	| { sent: false; error: string }

/**
 * Emails the link through Resend. Without an API key, local and test runs show the link on the
 * page instead, and a real deployment says sign-in isn't set up yet.
 */
export async function sendSignInLink(email: string, link: string): Promise<SendResult> {
	const key = process.env.RESEND_API_KEY
	if (!key) {
		const showLinks =
			process.env.NODE_ENV !== 'production' || process.env.COMPASS_SHOW_SIGN_IN_LINKS === '1'
		return showLinks
			? { sent: false, link }
			: { sent: false, error: 'Signing in isn’t set up yet.' }
	}
	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
		body: JSON.stringify({
			from: process.env.EMAIL_FROM ?? 'Compass <compass@johndennehy.dev>',
			to: [email],
			subject: 'Your Compass sign-in link',
			text: `Here's your link to sign in to Compass:\n\n${link}\n\nIt works once, for the next ${LINK_MINUTES} minutes. If you didn't ask for it, you can ignore this email.`,
		}),
		signal: AbortSignal.timeout(10_000),
	})
	return response.ok
		? { sent: true }
		: { sent: false, error: 'We couldn’t send the email. Please try again.' }
}
