import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { FilterBar } from '@/components/FilterBar'
import { FreshnessNote } from '@/components/Freshness'
import { Icon } from '@/components/Icon'
import { addDays, dayOf, describeAgo, describeDate, describeTimes, mondayOf } from '@/core/dates'
import { activeFilterCount, type Filters, matches } from '@/core/filters'
import { freshness } from '@/core/freshness'
import { type DayPlan, type Entry, planWeek } from '@/core/schedule'
import { SOURCE_DATE } from '@/data/spelthorne'
import { weekSearchSchema } from '@/lib/search'
import { getAreaData } from '@/server/api'

export const Route = createFileRoute('/')({
	validateSearch: weekSearchSchema,
	loaderDeps: ({ search }) => ({ area: search.area }),
	loader: ({ deps }) => getAreaData({ data: { area: deps.area } }),
	head: ({ loaderData }) => ({
		meta: loaderData
			? [{ title: `This week in ${loaderData.area.name} · Compass` }]
			: [{ title: 'Compass' }],
	}),
	component: WeekPage,
})

function WeekPage() {
	const data = Route.useLoaderData()
	const search = Route.useSearch()
	const navigate = useNavigate({ from: '/' })
	const [showFilters, setShowFilters] = useState(activeFilterCount(search) > 0)
	if (!data) return <p>We couldn’t find that area.</p>

	const { area, today } = data
	const offset = search.week ?? 0
	const monday = addDays(mondayOf(today), offset * 7)
	const filters: Filters = search
	const shown = data.listings.filter((l) => matches(l, filters))
	const week = planWeek(shown, area, monday)
	const past = offset === 0 ? week.filter((d) => d.date < today) : []
	const ahead = week.filter((d) => !past.includes(d))
	const weekdays = week.slice(0, 5).filter((d) => offset !== 0 || d.date >= today)
	const holidays = weekdays.filter((d) => d.term.kind === 'holiday')
	const holidayName = holidays[0]?.term.kind === 'holiday' ? holidays[0].term.name : null
	const holidayText = !holidayName
		? null
		: holidays.length === weekdays.length
			? `It’s ${holidayName}${offset === 0 ? ' for the rest of the week' : ' all week'}.`
			: `It’s ${holidayName} on ${holidays.map((d) => describeDate(d.date, today).split(' ')[0]).join(', ')}.`
	// When most listings haven't been checked in a long time, say so once instead of on every card.
	const staleCount = shown.filter((l) => freshness(l, today).level === 'stale').length
	const mostlyStale = shown.length > 0 && staleCount / shown.length > 0.5
	const sessionCount = week.reduce((n, d) => n + d.entries.length, 0)
	const title =
		offset === 0
			? 'This week'
			: offset === 1
				? 'Next week'
				: offset === -1
					? 'Last week'
					: `Week of ${describeDate(monday, today, false)}`

	return (
		<div>
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="eyebrow">{area.name}</p>
					<h1 className="text-3xl font-extrabold sm:text-5xl">{title}</h1>
					<p className="mt-1 text-muted sm:text-lg">
						{describeDate(monday, today)} to {describeDate(addDays(monday, 6), today)}
					</p>
				</div>
				<div className="flex shrink-0 gap-2 pt-5">
					<Link
						from="/"
						search={(s) => ({ ...s, week: offset - 1 || undefined })}
						disabled={offset <= -1}
						className="btn-quiet px-3 aria-disabled:opacity-40"
						aria-label="The week before"
					>
						<Icon name="left" />
					</Link>
					{offset !== 0 && (
						<Link from="/" search={(s) => ({ ...s, week: undefined })} className="btn-quiet">
							This week
						</Link>
					)}
					<Link
						from="/"
						search={(s) => ({ ...s, week: offset + 1 })}
						className="btn-quiet px-3"
						aria-label="The week after"
					>
						<Icon name="right" />
					</Link>
				</div>
			</div>

			{holidayText && (
				<p className="mt-4 rounded-2xl bg-sun-soft px-4 py-3">
					<strong>{holidayText}</strong> Groups that only run in term time are shown as not on.{' '}
					<a href={area.termSource.url} className="link">
						Term dates
					</a>
				</p>
			)}

			{mostlyStale && (
				<p className="mt-3 rounded-2xl border-2 border-edge px-4 py-3 text-sm sm:text-base">
					<strong>
						Most of these were last checked in {describeAgo(SOURCE_DATE.slice(0, 10), today)}
					</strong>
					, from the council’s leaflet. If you go to one, tap “still on” on its page to help others.
				</p>
			)}

			<button
				type="button"
				className="btn-quiet mt-5 w-full md:hidden"
				aria-expanded={showFilters}
				aria-controls="filters"
				onClick={() => setShowFilters((v) => !v)}
			>
				{showFilters
					? 'Hide filters'
					: `Filter by age, place or kind${activeFilterCount(filters) ? ` (${activeFilterCount(filters)} on)` : ''}`}
			</button>
			<div
				id="filters"
				className={`panel mt-3 p-4 md:mt-5 md:block ${showFilters ? '' : 'hidden'}`}
			>
				<FilterBar
					filters={filters}
					towns={area.towns}
					categories={data.categories}
					onChange={(next) =>
						navigate({ search: (s) => ({ area: s.area, week: s.week, ...next }), replace: true })
					}
				/>
				<p className="mt-3 text-sm text-muted" aria-live="polite">
					{sessionCount === 0
						? 'Nothing matches those filters this week.'
						: `${sessionCount} session${sessionCount === 1 ? '' : 's'} this week from ${shown.length} listing${shown.length === 1 ? '' : 's'}.`}
				</p>
			</div>

			<nav
				aria-label="Days"
				className="sticky top-0 z-30 -mx-4 mt-4 border-b border-edge bg-paper/95 px-4 py-2 backdrop-blur"
			>
				<ul className="grid grid-cols-7 gap-1">
					{week.map((d) => (
						<li key={d.date}>
							<a
								href={`#${d.date}`}
								className={`flex min-h-12 flex-col items-center justify-center rounded-xl text-sm font-bold leading-tight ${
									d.date === today ? 'bg-teal text-on-teal' : 'text-ink hover:bg-surface'
								}`}
								aria-label={describeDate(d.date, today)}
							>
								<span>
									{dayOf(d.date)
										.slice(0, 3)
										.replace(/^./, (c) => c.toUpperCase())}
								</span>
								<span className={`font-normal ${d.date === today ? '' : 'text-muted'}`}>
									{Number(d.date.slice(8))}
								</span>
							</a>
						</li>
					))}
				</ul>
			</nav>

			{past.length > 0 && (
				<details className="mt-6">
					<summary className="cursor-pointer font-bold text-muted">
						Earlier this week (
						{past.map((d) => describeDate(d.date, today).split(' ')[0]).join(', ')})
					</summary>
					{past.map((d) => (
						<DaySection key={d.date} day={d} today={today} data={data} hideStale={mostlyStale} />
					))}
				</details>
			)}
			{ahead.map((d) => (
				<DaySection key={d.date} day={d} today={today} data={data} hideStale={mostlyStale} />
			))}
		</div>
	)
}

type Data = NonNullable<ReturnType<typeof Route.useLoaderData>>

function DaySection({
	day,
	today,
	data,
	hideStale,
}: {
	day: DayPlan
	today: string
	data: Data
	hideStale: boolean
}) {
	const name = describeDate(day.date, today)
	const isToday = day.date === today
	return (
		<section id={day.date} aria-labelledby={`h-${day.date}`} className="mt-8">
			<h2 id={`h-${day.date}`} className="flex items-baseline gap-3 text-2xl font-extrabold">
				{name}
				{isToday && <span className="tag bg-sun text-[#1d2a33]">Today</span>}
			</h2>
			{day.entries.length === 0 ? (
				<p className="mt-3 text-muted">
					Nothing listed{dayOf(day.date) === 'sunday' ? ' on Sundays yet' : ''}.{' '}
					<Link to="/add" className="link">
						Know of something? Add it
					</Link>
				</p>
			) : (
				<ul className="mt-3 grid gap-3 lg:grid-cols-2">
					{day.entries.map((entry) => (
						<li key={`${entry.listing.id}-${entry.start}-${entry.label ?? ''}`}>
							<EntryCard
								entry={entry}
								today={today}
								stopped={data.stopped[entry.listing.id] ?? 0}
								isToday={isToday}
								nowMinutes={data.nowMinutes}
								hideStale={hideStale}
							/>
						</li>
					))}
				</ul>
			)}
		</section>
	)
}

function EntryCard({
	entry,
	today,
	stopped,
	isToday,
	nowMinutes,
	hideStale,
}: {
	entry: Entry
	today: string
	stopped: number
	isToday: boolean
	nowMinutes: number
	hideStale: boolean
}) {
	const { listing, status } = entry
	const off = status.kind === 'off'
	const fresh = freshness(listing, today, stopped)
	const endMinutes = entry.end ?? entry.start
	const over =
		isToday && endMinutes
			? Number(endMinutes.slice(0, 2)) * 60 + Number(endMinutes.slice(3)) <= nowMinutes
			: false
	return (
		<Link
			to="/listing/$slug"
			params={{ slug: listing.slug }}
			className={`panel flex gap-4 p-4 transition hover:border-teal ${off || over ? 'opacity-70' : ''}`}
		>
			<div className="w-24 shrink-0 sm:w-32">
				<p
					className={`font-display text-lg font-extrabold leading-tight ${off ? 'line-through decoration-2' : ''}`}
				>
					{describeTimes(entry.start, entry.end).replace(' to ', '–')}
				</p>
				{entry.label && <p className="text-sm text-muted">{entry.label}</p>}
			</div>
			<div className="min-w-0 flex-1">
				<h3 className="font-sans text-lg font-bold leading-snug">{listing.name}</h3>
				<p className="mt-0.5 flex items-start gap-1 text-muted">
					<Icon name="pin" className="mt-0.5 size-4" />
					<span>
						{listing.venue.name}, {listing.venue.town}
					</span>
				</p>
				<p className="mt-0.5">{listing.whoFor}</p>
				<div className="mt-2 flex flex-wrap gap-2">
					{status.kind === 'off' && <span className="tag bg-edge text-ink">{status.reason}</span>}
					{status.kind === 'check' && (
						<span className="tag bg-sun-soft text-ink">{status.reason}</span>
					)}
					{over && status.kind !== 'off' && (
						<span className="tag bg-edge text-ink">Finished for today</span>
					)}
					{entry.oneOff && <span className="tag bg-teal-soft text-teal">One-off event</span>}
					{listing.cost.kind === 'free' && <span className="tag bg-teal-soft text-teal">Free</span>}
					{listing.verified && (
						<span className="tag bg-teal-soft text-teal">
							<Icon name="verified" className="size-4" />
							Organiser
						</span>
					)}
				</div>
				{(fresh.warning ||
					(fresh.level !== 'recent' && !(hideStale && fresh.level === 'stale'))) && (
					<div className="mt-2">
						<FreshnessNote freshness={fresh} compact />
					</div>
				)}
			</div>
		</Link>
	)
}
