import { createFileRoute, Link, notFound, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { FreshnessNote } from '@/components/Freshness'
import { Icon } from '@/components/Icon'
import { ListingMap } from '@/components/ListingMap'
import { describeDay, describeTimes } from '@/core/dates'
import { freshness } from '@/core/freshness'
import { nextTimes } from '@/core/schedule'
import {
	costLabel,
	describeSessions,
	directionsUrl,
	hasTermTimeOnly,
	mapsUrl,
} from '@/lib/describe'
import { confirmListing, getListingPage } from '@/server/api'

export const Route = createFileRoute('/listing/$slug/')({
	loader: async ({ params }) => {
		const page = await getListingPage({ data: { slug: params.slug } })
		if (!page) throw notFound()
		return page
	},
	head: ({ loaderData }) => {
		if (!loaderData) return {}
		const { listing, area } = loaderData
		const description = `${listing.whoFor}. ${describeSessions(listing, loaderData.today).join('. ')}. ${listing.venue.name}, ${listing.venue.town}.`
		return {
			meta: [
				{ title: `${listing.name}, ${listing.venue.town} · Compass` },
				{ name: 'description', content: description },
				{ property: 'og:title', content: `${listing.name}, ${listing.venue.town}` },
				{
					property: 'og:description',
					content: `${description} Listed on Compass for ${area.name}.`,
				},
			],
		}
	},
	component: ListingPage,
})

function ListingPage() {
	const page = Route.useLoaderData()
	const { listing, area, today, category } = page
	const fresh = freshness(listing, today, page.stopped)
	const next = nextTimes(listing, area, today, page.nowMinutes, 3)
	const cost = costLabel(listing)

	return (
		<article className="mx-auto max-w-3xl">
			<Link to="/" className="link inline-flex items-center gap-1">
				<Icon name="left" className="size-4" />
				Back to the week
			</Link>

			{listing.status === 'hidden' && (
				<p className="mt-4 rounded-2xl bg-coral-soft p-4 font-bold text-coral">
					This listing has been taken down. Only moderators can see it.
				</p>
			)}

			<header className="mt-4">
				<p className="eyebrow">{category?.name ?? 'Listing'}</p>
				<h1 className="mt-1 text-4xl font-extrabold leading-tight sm:text-5xl">{listing.name}</h1>
				<p className="mt-2 text-xl">{listing.whoFor}</p>
				<div className="mt-3 flex flex-wrap gap-2">
					{listing.verified && (
						<span className="tag bg-teal-soft text-teal">
							<Icon name="verified" className="size-4" />
							Kept up to date by the organiser
						</span>
					)}
					{listing.when.kind === 'one-off' && (
						<span className="tag bg-teal-soft text-teal">One-off event</span>
					)}
					{cost && <span className="tag bg-teal-soft text-teal">{cost}</span>}
				</div>
				{listing.summary && <p className="mt-4 text-lg">{listing.summary}</p>}
			</header>

			<div className="mt-4">
				<FreshnessNote freshness={fresh} />
			</div>

			<section aria-labelledby="when" className="mt-8">
				<h2 id="when" className="text-2xl font-extrabold">
					When
				</h2>
				<ul className="mt-3 grid gap-1 text-lg">
					{describeSessions(listing, today).map((line) => (
						<li key={line} className="flex items-start gap-2">
							<Icon name="clock" className="mt-1 text-teal" />
							{line}
						</li>
					))}
				</ul>
				{hasTermTimeOnly(listing) && (
					<p className="mt-2 text-muted">
						Term time only, so not in the school holidays.{' '}
						<a className="link" href={area.termSource.url}>
							Term dates
						</a>
					</p>
				)}
				{listing.when.kind === 'regular' && next.length > 0 && (
					<div className="mt-4 rounded-2xl bg-teal-soft p-4">
						<h3 className="font-sans font-bold">Next on</h3>
						<ul className="mt-1">
							{next.map((e) => (
								<li key={`${e.date}-${e.start}`}>
									{describeDay(e.date, today)}, {describeTimes(e.start, e.end).toLowerCase()}
									{e.label && ` (${e.label.toLowerCase()})`}
									{e.status.kind === 'check' && (
										<span className="text-muted"> (check it’s on)</span>
									)}
								</li>
							))}
						</ul>
					</div>
				)}
			</section>

			<section aria-labelledby="where" className="mt-8">
				<h2 id="where" className="text-2xl font-extrabold">
					Where
				</h2>
				<p className="mt-3 text-lg">
					<strong>{listing.venue.name}</strong>
					<br />
					{listing.venue.address}
					{listing.venue.postcode && (
						<>
							<br />
							{listing.venue.postcode}
						</>
					)}
				</p>
				<div className="mt-4 flex flex-wrap gap-3">
					<a href={mapsUrl(listing.venue)} className="btn-primary" target="_blank" rel="noreferrer">
						<Icon name="map" />
						Open in Google Maps
					</a>
					<a
						href={directionsUrl(listing.venue)}
						className="btn-quiet"
						target="_blank"
						rel="noreferrer"
					>
						<Icon name="directions" />
						Directions
					</a>
				</div>
				<ListingMap listings={[listing]} centre={area.centre} single className="mt-4 h-64" />
			</section>

			<section aria-label="Been recently?" className="panel mt-8 p-5">
				<StillOn listingId={listing.id} slug={listing.slug} />
			</section>

			{(listing.contacts.length > 0 || listing.links.length > 0 || listing.notes) && (
				<section aria-labelledby="more" className="mt-8">
					<h2 id="more" className="text-2xl font-extrabold">
						Good to know
					</h2>
					{listing.notes && <p className="mt-3 text-lg">{listing.notes}</p>}
					<ul className="mt-3 grid gap-2">
						{listing.contacts.map((c) => (
							<li key={`${c.kind}-${c.value}`}>
								<a
									className="link inline-flex items-center gap-2"
									href={`${c.kind === 'email' ? 'mailto' : c.kind === 'text' ? 'sms' : 'tel'}:${c.value.replace(/\s/g, '')}`}
								>
									<Icon name="phone" />
									{c.kind === 'text' ? 'Text' : c.kind === 'email' ? 'Email' : 'Call'}{' '}
									{c.name ? `${c.name} on ` : ''}
									{c.value}
								</a>
							</li>
						))}
						{listing.links.map((l) => (
							<li key={l.url}>
								<a
									className="link inline-flex items-center gap-2"
									href={l.url}
									rel="noreferrer nofollow"
									target="_blank"
								>
									<Icon name="link" />
									{
										{
											website: 'Website',
											facebook: 'Facebook',
											instagram: 'Instagram',
											other: 'More information',
										}[l.kind]
									}
								</a>
							</li>
						))}
					</ul>
				</section>
			)}

			<ShareButton name={listing.name} />

			<footer className="mt-10 grid gap-3 border-t border-edge pt-6 text-muted">
				<p className="flex items-center gap-2">
					<Icon name="history" />
					{page.changes === 0
						? 'No changes since it was added.'
						: `Changed ${page.changes} time${page.changes === 1 ? '' : 's'} since it was added.`}{' '}
					<Link to="/listing/$slug/history" params={{ slug: listing.slug }} className="link">
						See the history
					</Link>
				</p>
				{page.trust !== 'organiser' && !listing.verified && (
					<p>
						Do you run this?{' '}
						<Link to="/listing/$slug/claim" params={{ slug: listing.slug }} className="link">
							Look after this listing
						</Link>
					</p>
				)}
			</footer>
		</article>
	)
}

function StillOn({ listingId, slug }: { listingId: string; slug: string }) {
	const router = useRouter()
	const [message, setMessage] = useState<string | null>(null)
	const [busy, setBusy] = useState(false)

	async function send(kind: 'running' | 'stopped') {
		setBusy(true)
		try {
			const result = await confirmListing({ data: { listingId, kind } })
			setMessage(result.ok ? result.message : result.message)
			await router.invalidate()
		} catch {
			setMessage('That didn’t send. Please try again.')
		} finally {
			setBusy(false)
		}
	}

	return (
		<div>
			<h2 className="text-2xl font-extrabold">Been recently?</h2>
			<p className="hint">Your answer helps everyone else. You don’t need to sign in.</p>
			{message ? (
				<p role="status" className="mt-3 flex items-center gap-2 font-bold text-teal">
					<Icon name="check" />
					{message}
				</p>
			) : (
				<div className="mt-3 flex flex-wrap gap-2">
					<button
						type="button"
						className="btn-primary"
						disabled={busy}
						onClick={() => send('running')}
					>
						<Icon name="check" />
						Yes, it’s still on
					</button>
					<Link to="/listing/$slug/change" params={{ slug }} className="btn-quiet">
						Something’s changed
					</Link>
					<button
						type="button"
						className="btn-quiet"
						disabled={busy}
						onClick={() => send('stopped')}
					>
						It’s stopped
					</button>
				</div>
			)}
		</div>
	)
}

function ShareButton({ name }: { name: string }) {
	const [copied, setCopied] = useState(false)
	async function share() {
		const url = window.location.href
		if (navigator.share) {
			try {
				await navigator.share({ title: name, url })
				return
			} catch {
				// Cancelled, or not allowed: fall back to copying.
			}
		}
		await navigator.clipboard?.writeText(url)
		setCopied(true)
	}
	return (
		<div className="mt-8">
			<button type="button" className="btn-quiet" onClick={share}>
				<Icon name="share" />
				{copied ? 'Link copied' : 'Share with a friend'}
			</button>
		</div>
	)
}
