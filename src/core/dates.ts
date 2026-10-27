import { DAYS, type Day, type IsoDate } from './listing'

/**
 * Calendar dates without time zones. Compass is about local sessions, so "today" always means
 * today where the listings are, which for now is the UK. Dates are plain "YYYY-MM-DD" strings,
 * and the arithmetic runs on noon UTC so daylight saving never shifts a day.
 */

export const TIME_ZONE = 'Europe/London'
const DAY_MS = 24 * 60 * 60 * 1000

const parts = new Intl.DateTimeFormat('en-GB', {
	timeZone: TIME_ZONE,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
	hourCycle: 'h23',
})

/** The local date and minutes past midnight for an instant. */
export function localNow(now: Date): { date: IsoDate; minutes: number } {
	const p = Object.fromEntries(parts.formatToParts(now).map((x) => [x.type, x.value]))
	return {
		date: `${p.year}-${p.month}-${p.day}`,
		minutes: Number(p.hour) * 60 + Number(p.minute),
	}
}

function toUtcNoon(date: IsoDate): Date {
	return new Date(`${date}T12:00:00Z`)
}

export function addDays(date: IsoDate, days: number): IsoDate {
	return new Date(toUtcNoon(date).getTime() + days * DAY_MS).toISOString().slice(0, 10)
}

export function daysBetween(from: IsoDate, to: IsoDate): number {
	return Math.round((toUtcNoon(to).getTime() - toUtcNoon(from).getTime()) / DAY_MS)
}

export function dayOf(date: IsoDate): Day {
	// getUTCDay is 0 for Sunday; DAYS starts on Monday.
	return DAYS[(toUtcNoon(date).getUTCDay() + 6) % 7] as Day
}

/** The Monday on or before a date. */
export function mondayOf(date: IsoDate): IsoDate {
	return addDays(date, -DAYS.indexOf(dayOf(date)))
}

export function isIsoDate(value: string): value is IsoDate {
	return /^\d{4}-\d{2}-\d{2}$/.test(value) && toUtcNoon(value).toISOString().startsWith(value)
}

/** "Monday 2 November", or "Monday 2 November 2027" when it isn't this year. */
export function describeDate(date: IsoDate, today: IsoDate, withWeekday = true): string {
	const d = toUtcNoon(date)
	const format = (options: Intl.DateTimeFormatOptions) =>
		d.toLocaleDateString('en-GB', { timeZone: 'UTC', ...options })
	const words = [
		withWeekday ? format({ weekday: 'long' }) : '',
		format({ day: 'numeric' }),
		format({ month: 'long' }),
		date.slice(0, 4) === today.slice(0, 4) ? '' : date.slice(0, 4),
	]
	return words.filter(Boolean).join(' ')
}

/** "Today", "Tomorrow", or the date. */
export function describeDay(date: IsoDate, today: IsoDate): string {
	const gap = daysBetween(today, date)
	if (gap === 0) return 'Today'
	if (gap === 1) return 'Tomorrow'
	return describeDate(date, today)
}

export function dayName(day: Day): string {
	return day[0]?.toUpperCase() + day.slice(1)
}

/** "09:30" → "9:30am", "12:00" → "12pm", "14:00" → "2pm". */
export function describeTime(time: string): string {
	const [h = 0, m = 0] = time.split(':').map(Number)
	const suffix = h >= 12 ? 'pm' : 'am'
	const hour = h % 12 === 0 ? 12 : h % 12
	return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, '0')}${suffix}`
}

/** "9:30am to 11:30am", or "from 2:30pm" when there's no end time. */
export function describeTimes(start?: string, end?: string): string {
	if (!start) return 'Time not known'
	return end ? `${describeTime(start)} to ${describeTime(end)}` : `From ${describeTime(start)}`
}

export function minutesOf(time: string): number {
	const [h = 0, m = 0] = time.split(':').map(Number)
	return h * 60 + m
}

/** "3 days ago", "2 weeks ago", "4 months ago", or "September 2025" once it's over a year. */
export function describeAgo(date: IsoDate, today: IsoDate): string {
	const days = daysBetween(date, today)
	if (days <= 0) return 'today'
	if (days === 1) return 'yesterday'
	if (days < 14) return `${days} days ago`
	if (days < 60) return `${Math.round(days / 7)} weeks ago`
	if (days < 365) return `${Math.round(days / 30.4)} months ago`
	return toUtcNoon(date).toLocaleDateString('en-GB', {
		timeZone: 'UTC',
		month: 'long',
		year: 'numeric',
	})
}
