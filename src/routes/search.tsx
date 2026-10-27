import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { FilterBar } from '@/components/FilterBar'
import { FreshnessNote } from '@/components/Freshness'
import { Icon } from '@/components/Icon'
import { ListingMap, mapsEnabled } from '@/components/ListingMap'
import { describeMiles, milesBetween, normalisePostcode, type Point } from '@/core/distance'
import { type Filters, matches } from '@/core/filters'
import { byFreshness, freshness } from '@/core/freshness'
import type { Listing } from '@/core/listing'
import { describeSessions } from '@/lib/describe'
import { findSearchSchema } from '@/lib/search'
import { getAreaData, lookupNear } from '@/server/api'

export const Route = createFileRoute('/search')({
	validateSearch: findSearchSchema,
	loaderDeps: ({ search }) => ({ area: search.area, near: search.near }),
	loader: async ({ deps }) => {
		const [data, near] = await Promise.all([
			getAreaData({ data: { area: deps.area } }),
			deps.near ? lookupNear({ data: { postcode: deps.near } }) : Promise.resolve(null),
		])
		return data ? { ...data, near } : null
	},
	head: ({ loaderData }) => ({
		meta: [{ title: loaderData ? `Search ${loaderData.area.name} · Compass` : 'Compass' }],
	}),
	component: SearchPage,
})

function SearchPage() {
	const data = Route.useLoaderData()
	const search = Route.useSearch()
	const navigate = useNavigate({ from: '/search' })
	const [q, setQ] = useState(search.q ?? '')
	const [postcode, setPostcode] = useState(search.near ?? '')
	const [postcodeError, setPostcodeError] = useState<string | null>(null)
	const [selected, setSelected] = useState<string | null>(null)

	// Search as people type, without adding every letter to the history.
	useEffect(() => {
		const timer = setTimeout(() => {
			if ((search.q ?? '') !== q) {
				navigate({ search: (s) => ({ ...s, q: q.trim() || undefined }), replace: true })
			}
		}, 250)
		return () => clearTimeout(timer)
	}, [q, search.q, navigate])

	if (!data) return <p>We couldn’t find that area.</p>
	const filters: Filters = search
	const near: Point | null = data.near
	const results = data.listings
		.filter((l) => matches(l, filters))
		.map((listing) => ({
			listing,
			fresh: freshness(listing, data.today, data.stopped[listing.id] ?? 0),
			miles:
				near && listing.venue.lat !== undefined && listing.venue.lng !== undefined
					? milesBetween(near, { lat: listing.venue.lat, lng: listing.venue.lng })
					: null,
		}))
		.sort((a, b) =>
			near
				? (a.miles ?? 999) - (b.miles ?? 999)
				: byFreshness(a.fresh, b.fresh) || a.listing.name.localeCompare(b.listing.name),
		)
	const view = search.view ?? 'list'

	return (
		<div>
			<p className="eyebrow">{data.area.name}</p>
			<h1 className="text-3xl font-extrabold sm:text-5xl">Search</h1>

			<div className="panel mt-5 grid gap-4 p-4">
				<div className="grid gap-3 sm:grid-cols-[1fr_auto]">
					<label>
						<span className="label">Name, place or anything else</span>
						<input
							type="search"
							className="field"
							value={q}
							onChange={(e) => setQ(e.target.value)}
							placeholder="For example: rhymetime, Ashford, messy play"
						/>
					</label>
					<form
						className="flex items-end gap-2"
						onSubmit={(e) => {
							e.preventDefault()
							if (!postcode.trim()) {
								setPostcodeError(null)
								navigate({ search: (s) => ({ ...s, near: undefined }), replace: true })
								return
							}
							const tidy = normalisePostcode(postcode)
							if (!tidy) {
								setPostcodeError('That doesn’t look like a postcode.')
								return
							}
							setPostcodeError(null)
							setPostcode(tidy)
							navigate({ search: (s) => ({ ...s, near: tidy }), replace: true })
						}}
					>
						<label>
							<span className="label">Near a postcode</span>
							<input
								className="field w-36 uppercase"
								value={postcode}
								onChange={(e) => setPostcode(e.target.value)}
								autoComplete="postal-code"
								placeholder="TW18 1AY"
							/>
						</label>
						<button type="submit" className="btn-quiet">
							Sort
						</button>
					</form>
				</div>
				{(postcodeError || (search.near && !near)) && (
					<p className="font-bold text-coral" role="alert">
						{postcodeError ?? 'We couldn’t find that postcode, so results are in the usual order.'}
					</p>
				)}
				<FilterBar
					filters={filters}
					towns={data.area.towns}
					categories={data.categories}
					onChange={(next) =>
						navigate({
							search: (s) => ({ area: s.area, near: s.near, view: s.view, ...next, q: s.q }),
							replace: true,
						})
					}
				/>
			</div>

			<div className="mt-4 flex items-center justify-between gap-3">
				<p aria-live="polite" className="font-bold">
					{results.length} result{results.length === 1 ? '' : 's'}
					{near && search.near ? ` nearest ${search.near} first` : ''}
				</p>
				{mapsEnabled && (
					<fieldset className="flex rounded-xl border-2 border-edge bg-surface p-0.5 lg:hidden">
						<legend className="sr-only">Show as</legend>
						{(['list', 'map'] as const).map((v) => (
							<button
								key={v}
								type="button"
								aria-pressed={view === v}
								onClick={() =>
									navigate({
										search: (s) => ({ ...s, view: v === 'list' ? undefined : v }),
										replace: true,
									})
								}
								className="flex min-h-10 items-center gap-1 rounded-lg px-3 font-bold aria-pressed:bg-teal aria-pressed:text-on-teal"
							>
								<Icon name={v} />
								{v === 'list' ? 'List' : 'Map'}
							</button>
						))}
					</fieldset>
				)}
			</div>

			<div className="mt-3 grid gap-6 lg:grid-cols-[1fr_minmax(0,26rem)]">
				<ul className={`grid content-start gap-3 ${view === 'map' ? 'hidden lg:grid' : ''}`}>
					{results.map(({ listing, fresh, miles }) => (
						<li key={listing.id}>
							<ResultCard
								listing={listing}
								today={data.today}
								miles={miles}
								fresh={fresh}
								selected={selected === listing.id}
							/>
						</li>
					))}
					{results.length === 0 && (
						<li className="panel p-6 text-center text-muted">
							Nothing matches. Try fewer words or filters, or{' '}
							<Link to="/add" className="link">
								add something
							</Link>
							.
						</li>
					)}
				</ul>
				<div className={view === 'map' ? '' : 'hidden lg:block'}>
					<ListingMap
						listings={results.map((r) => r.listing)}
						centre={near ?? data.area.centre}
						className="h-[70dvh] lg:sticky lg:top-4"
						selected={selected}
						onSelect={setSelected}
					/>
				</div>
			</div>
		</div>
	)
}

function ResultCard({
	listing,
	today,
	miles,
	fresh,
	selected,
}: {
	listing: Listing
	today: string
	miles: number | null
	fresh: ReturnType<typeof freshness>
	selected: boolean
}) {
	return (
		<Link
			to="/listing/$slug"
			params={{ slug: listing.slug }}
			className={`panel block p-4 hover:border-teal ${selected ? 'border-teal ring-2 ring-teal' : ''}`}
		>
			<div className="flex items-start justify-between gap-3">
				<h2 className="font-sans text-lg font-bold leading-snug">{listing.name}</h2>
				{miles !== null && (
					<span className="tag shrink-0 bg-teal-soft text-teal">{describeMiles(miles)}</span>
				)}
			</div>
			<p className="text-muted">
				{listing.venue.name}, {listing.venue.town}
			</p>
			<p className="mt-1">{listing.whoFor}</p>
			<ul className="mt-1 text-sm">
				{describeSessions(listing, today).map((line) => (
					<li key={line}>{line}</li>
				))}
			</ul>
			<div className="mt-2">
				<FreshnessNote freshness={fresh} compact />
			</div>
		</Link>
	)
}
