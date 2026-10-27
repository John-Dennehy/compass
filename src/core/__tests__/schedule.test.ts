import { describe, expect, it } from 'vitest'
import { spelthorne } from '@/data/spelthorne'
import {
	entriesOn,
	isOver,
	nextTimes,
	planWeek,
	runsOn,
	termStatus,
	upcomingEvents,
} from '../schedule'
import { makeListing } from './helpers'

describe('term dates', () => {
	it('knows term time, half term and the holidays', () => {
		expect(termStatus(spelthorne, '2026-10-12')).toEqual({ kind: 'term' })
		// Surrey's autumn 2026 half term is two weeks.
		expect(termStatus(spelthorne, '2026-10-27')).toEqual({ kind: 'holiday', name: 'half term' })
		expect(termStatus(spelthorne, '2026-12-24')).toEqual({
			kind: 'holiday',
			name: 'the Christmas holidays',
		})
		expect(termStatus(spelthorne, '2026-08-10')).toEqual({
			kind: 'holiday',
			name: 'the summer holidays',
		})
		expect(termStatus(spelthorne, '2027-04-01')).toEqual({
			kind: 'holiday',
			name: 'the Easter holidays',
		})
	})

	it('admits when it does not know', () => {
		expect(termStatus(spelthorne, '2027-09-10')).toEqual({ kind: 'unknown' })
		expect(termStatus({ terms: [] }, '2026-10-12')).toEqual({ kind: 'unknown' })
	})
})

describe('repeating sessions', () => {
	const base = { day: 'tuesday' as const, start: '10:00', termTimeOnly: false }

	it('runs weekly on its day', () => {
		expect(runsOn({ ...base, every: { kind: 'week' } }, '2026-10-27')).toBe('yes')
		expect(runsOn({ ...base, every: { kind: 'week' } }, '2026-10-28')).toBe('no')
	})

	it('runs fortnightly from a known date, forwards and backwards', () => {
		const every = { kind: 'fortnight' as const, from: '2026-10-13' }
		expect(runsOn({ ...base, every }, '2026-10-27')).toBe('yes')
		expect(runsOn({ ...base, every }, '2026-11-03')).toBe('no')
		expect(runsOn({ ...base, every }, '2026-09-29')).toBe('yes')
	})

	it('runs monthly on the nth or last weekday', () => {
		expect(runsOn({ ...base, every: { kind: 'month', week: 1 } }, '2026-10-06')).toBe('yes')
		expect(runsOn({ ...base, every: { kind: 'month', week: 1 } }, '2026-10-13')).toBe('no')
		expect(runsOn({ ...base, every: { kind: 'month', week: 'last' } }, '2026-10-27')).toBe('yes')
		expect(runsOn({ ...base, every: { kind: 'month', week: 4 } }, '2026-10-27')).toBe('yes')
		expect(runsOn({ ...base, every: { kind: 'month', week: 'last' } }, '2026-10-20')).toBe('no')
	})
})

describe('the week', () => {
	const termTime = makeListing({
		id: 'term',
		name: 'Term Group',
		when: {
			kind: 'regular',
			sessions: [{ day: 'tuesday', start: '09:30', end: '11:30', termTimeOnly: true }],
		},
	})
	const always = makeListing({
		id: 'always',
		name: 'Always Group',
		when: { kind: 'regular', sessions: [{ day: 'tuesday', start: '09:00', end: '10:00' }] },
	})
	const event = makeListing({
		id: 'fair',
		name: 'Autumn Fair',
		when: { kind: 'one-off', dates: [{ date: '2026-10-31', start: '11:00', end: '15:00' }] },
	})

	it('lays out seven days from Monday with each day in time order', () => {
		const week = planWeek([termTime, always, event], spelthorne, '2026-10-26')
		expect(week.map((d) => d.date)).toEqual([
			'2026-10-26',
			'2026-10-27',
			'2026-10-28',
			'2026-10-29',
			'2026-10-30',
			'2026-10-31',
			'2026-11-01',
		])
		expect(week[1]?.entries.map((e) => e.listing.id)).toEqual(['always', 'term'])
		expect(week[5]?.entries.map((e) => [e.listing.id, e.oneOff])).toEqual([['fair', true]])
	})

	it('shows term-time groups as off in the holidays, rather than hiding them', () => {
		const [entry] = entriesOn([termTime], spelthorne, '2026-10-27')
		expect(entry?.status).toEqual({ kind: 'off', reason: 'Not on in half term' })
		const [inTerm] = entriesOn([termTime], spelthorne, '2026-11-03')
		expect(inTerm?.status).toEqual({ kind: 'on' })
		const [unknown] = entriesOn([termTime], spelthorne, '2027-09-14')
		expect(unknown?.status.kind).toBe('check')
	})

	it('finds the next times something is on, skipping holidays and finished sessions', () => {
		const next = nextTimes(termTime, spelthorne, '2026-10-27', 9 * 60, 2)
		expect(next.map((e) => e.date)).toEqual(['2026-11-03', '2026-11-10'])
		// At 10:30 on Tuesday the 9-10 session is over, so the next one is a week later.
		expect(nextTimes(always, spelthorne, '2026-11-03', 10 * 60 + 30, 1)[0]?.date).toBe('2026-11-10')
		expect(nextTimes(always, spelthorne, '2026-11-03', 9 * 60 + 30, 1)[0]?.date).toBe('2026-11-03')
	})

	it('lists one-off events in date order and knows when they are over', () => {
		const later = makeListing({
			id: 'later',
			when: { kind: 'one-off', dates: [{ date: '2026-11-20' }, { date: '2026-10-29' }] },
		})
		const soon = upcomingEvents([event, later, always], '2026-10-27', 30)
		expect(soon.map((s) => [s.listing.id, s.occurrence.date])).toEqual([
			['later', '2026-10-29'],
			['fair', '2026-10-31'],
			['later', '2026-11-20'],
		])
		expect(isOver(event, '2026-11-01')).toBe(true)
		expect(isOver(event, '2026-10-31')).toBe(false)
		expect(isOver(always, '2030-01-01')).toBe(false)
	})
})
