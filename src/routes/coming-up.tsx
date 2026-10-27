import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { FilterBar } from '@/components/FilterBar'
import { Icon } from '@/components/Icon'
import { describeDay, describeTimes } from '@/core/dates'
import { type Filters, matches } from '@/core/filters'
import { upcomingEvents } from '@/core/schedule'
import { searchSchema } from '@/lib/search'
import { getAreaData } from '@/server/api'

const WEEKS_AHEAD = 12

export const Route = createFileRoute('/coming-up')({
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => ({ area: search.area }),
	loader: ({ deps }) => getAreaData({ data: { area: deps.area } }),
	head: ({ loaderData }) => ({
		meta: [{ title: loaderData ? `Coming up in ${loaderData.area.name} · Compass` : 'Compass' }],
	}),
	component: ComingUp,
})

function ComingUp() {
	const data = Route.useLoaderData()
	const search = Route.useSearch()
	const navigate = useNavigate({ from: '/coming-up' })
	if (!data) return <p>We couldn’t find that area.</p>
	const filters: Filters = search
	const events = upcomingEvents(
		data.listings.filter((l) => matches(l, filters)),
		data.today,
		WEEKS_AHEAD * 7,
	)
	const byDate = new Map<string, typeof events>()
	for (const e of events)
		byDate.set(e.occurrence.date, [...(byDate.get(e.occurrence.date) ?? []), e])

	return (
		<div>
			<p className="eyebrow">{data.area.name}</p>
			<h1 className="text-3xl font-extrabold sm:text-5xl">Coming up</h1>
			<p className="mt-2 max-w-2xl text-lg text-muted">
				One-off events in the next {WEEKS_AHEAD} weeks: fairs, open days, holiday activities and the
				like. Regular groups are on{' '}
				<Link to="/" className="link">
					the week
				</Link>
				.
			</p>

			<div className="panel mt-5 p-4">
				<FilterBar
					filters={filters}
					towns={data.area.towns}
					categories={data.categories}
					onChange={(next) =>
						navigate({ search: (s) => ({ area: s.area, ...next }), replace: true })
					}
				/>
			</div>

			{events.length === 0 ? (
				<div className="panel mt-8 p-6 text-center">
					<h2 className="text-2xl font-extrabold">Nothing coming up yet</h2>
					<p className="mx-auto mt-2 max-w-md text-muted">
						Compass is new, and one-off events are added by people like you. If you know of one, add
						it and everyone nearby will see it.
					</p>
					<Link to="/add" search={{ kind: 'one-off' }} className="btn-primary mt-5">
						<Icon name="plus" />
						Add an event
					</Link>
				</div>
			) : (
				[...byDate].map(([date, items]) => (
					<section key={date} aria-labelledby={`h-${date}`} className="mt-8">
						<h2 id={`h-${date}`} className="text-2xl font-extrabold">
							{describeDay(date, data.today)}
						</h2>
						<ul className="mt-3 grid gap-3">
							{items.map(({ listing, occurrence }) => (
								<li key={`${listing.id}-${date}`}>
									<Link
										to="/listing/$slug"
										params={{ slug: listing.slug }}
										className="panel flex gap-4 p-4 hover:border-teal"
									>
										<p className="w-28 shrink-0 font-display text-lg font-extrabold">
											{describeTimes(occurrence.start, occurrence.end).replace(' to ', '–')}
										</p>
										<div>
											<h3 className="font-sans text-lg font-bold">{listing.name}</h3>
											<p className="text-muted">
												{listing.venue.name}, {listing.venue.town}
											</p>
											<p>{listing.whoFor}</p>
										</div>
									</Link>
								</li>
							))}
						</ul>
					</section>
				))
			)}
		</div>
	)
}
