import { describe, expect, it } from 'vitest'
import {
	addDays,
	dayOf,
	describeAgo,
	describeDay,
	describeTime,
	describeTimes,
	isIsoDate,
	localNow,
	mondayOf,
} from '../dates'

describe('dates', () => {
	it('uses UK local time for today', () => {
		// 23:30 UTC in summer is already the next day in London.
		expect(localNow(new Date('2026-07-01T23:30:00Z'))).toEqual({ date: '2026-07-02', minutes: 30 })
		// In winter London is on UTC.
		expect(localNow(new Date('2026-12-01T23:30:00Z')).date).toBe('2026-12-01')
	})

	it('does date arithmetic across the clocks changing', () => {
		expect(addDays('2026-10-24', 2)).toBe('2026-10-26')
		expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
		expect(dayOf('2026-10-27')).toBe('tuesday')
		expect(mondayOf('2026-10-27')).toBe('2026-10-26')
		expect(mondayOf('2026-11-01')).toBe('2026-10-26')
		expect(mondayOf('2026-10-26')).toBe('2026-10-26')
	})

	it('rejects dates that do not exist', () => {
		expect(isIsoDate('2026-02-29')).toBe(false)
		expect(isIsoDate('2028-02-29')).toBe(true)
		expect(isIsoDate('next week')).toBe(false)
	})

	it('describes times the way people say them', () => {
		expect(describeTime('09:30')).toBe('9:30am')
		expect(describeTime('12:00')).toBe('12pm')
		expect(describeTime('13:15')).toBe('1:15pm')
		expect(describeTime('00:00')).toBe('12am')
		expect(describeTimes('10:00', '12:00')).toBe('10am to 12pm')
		expect(describeTimes('14:30')).toBe('From 2:30pm')
	})

	it('describes days and how long ago', () => {
		expect(describeDay('2026-10-27', '2026-10-27')).toBe('Today')
		expect(describeDay('2026-10-28', '2026-10-27')).toBe('Tomorrow')
		expect(describeDay('2026-11-02', '2026-10-27')).toBe('Monday 2 November')
		expect(describeDay('2027-01-04', '2026-10-27')).toBe('Monday 4 January 2027')
		expect(describeAgo('2026-10-24', '2026-10-27')).toBe('3 days ago')
		expect(describeAgo('2026-10-06', '2026-10-27')).toBe('3 weeks ago')
		expect(describeAgo('2026-06-27', '2026-10-27')).toBe('4 months ago')
		expect(describeAgo('2025-09-01', '2026-10-27')).toBe('September 2025')
	})
})
