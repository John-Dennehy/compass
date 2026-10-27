import { afterEach, describe, expect, it } from 'vitest'
import { hashToken, isModerator, makeSession, makeToken, readSession, safeNext } from '../auth'

describe('sign-in', () => {
	const now = new Date('2026-11-03T10:00:00Z')

	afterEach(() => {
		delete process.env.MODERATOR_EMAILS
	})

	it('signs sessions and rejects tampering and old ones', () => {
		const cookie = makeSession('abc', now)
		expect(readSession(cookie, now)).toBe('abc')
		const [payload, signature] = cookie.split('.')
		const forged = `${Buffer.from(JSON.stringify({ c: 'someone-else', e: Date.now() + 1e9 })).toString('base64url')}.${signature}`
		expect(readSession(forged, now)).toBeNull()
		expect(readSession(`${payload}.x`, now)).toBeNull()
		expect(readSession(cookie, new Date('2027-06-01T00:00:00Z'))).toBeNull()
		expect(readSession(undefined, now)).toBeNull()
	})

	it('stores only a hash of the emailed token', () => {
		const { token, hash } = makeToken()
		expect(hash).toBe(hashToken(token))
		expect(hash).not.toContain(token)
	})

	it('reads moderators from the environment, ignoring case', () => {
		process.env.MODERATOR_EMAILS = 'John@Example.com, other@example.com'
		expect(isModerator('john@example.com')).toBe(true)
		expect(isModerator('nobody@example.com')).toBe(false)
	})

	it('only sends people back to pages on this site', () => {
		expect(safeNext('/listing/abc')).toBe('/listing/abc')
		expect(safeNext('https://evil.example')).toBe('/')
		expect(safeNext('//evil.example')).toBe('/')
		expect(safeNext('/\\evil.example')).toBe('/')
		expect(safeNext(undefined)).toBe('/')
	})
})
