import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Icon } from '@/components/Icon'
import { changedFields } from '@/core/changes'
import { describeDate } from '@/core/dates'
import { DETAIL_FIELDS, FIELD_NAMES } from '@/core/listing'
import { describeField } from '@/lib/describe'
import {
	confirmListing,
	getAreaData,
	getModerationQueue,
	refreshMapPositions,
	reviewSuggestion,
	setListingHidden,
} from '@/server/api'
import type { QueueItem } from '@/server/service'

export const Route = createFileRoute('/moderate')({
	loader: async () => {
		const [queue, area] = await Promise.all([getModerationQueue(), getAreaData({ data: {} })])
		return queue ? { ...queue, categories: area?.categories ?? [] } : null
	},
	head: () => ({
		meta: [{ title: 'Moderation · Compass' }, { name: 'robots', content: 'noindex' }],
	}),
	component: ModeratePage,
})

const TRUST = {
	moderator: 'Moderator',
	organiser: 'Organiser',
	trusted: 'Trusted',
	new: 'New',
} as const

function ModeratePage() {
	const data = Route.useLoaderData()
	const router = useRouter()
	const [message, setMessage] = useState<string | null>(null)

	if (!data) {
		return (
			<div className="mx-auto max-w-xl">
				<h1 className="text-4xl font-extrabold">Moderators only</h1>
				<p className="mt-3">Sign in with a moderator’s email address to see the queue.</p>
				<Link to="/sign-in" search={{ next: '/moderate' }} className="btn-primary mt-6">
					Sign in
				</Link>
			</div>
		)
	}

	return (
		<div className="mx-auto max-w-3xl">
			<h1 className="text-4xl font-extrabold">Moderation</h1>
			<p className="mt-2 text-lg text-muted">
				{data.items.length === 0
					? 'Nothing waiting. Thank you!'
					: `${data.items.length} waiting, people with a good record first.`}
			</p>
			{message && (
				<p role="status" className="mt-4 rounded-2xl bg-teal-soft p-4 font-bold text-teal">
					{message}
				</p>
			)}

			<ul className="mt-6 grid gap-4">
				{data.items.map((item) => (
					<li key={item.suggestion.id}>
						<Suggestion
							item={item}
							today={data.today}
							categories={data.categories}
							onDone={async (text) => {
								setMessage(text)
								await router.invalidate()
							}}
						/>
					</li>
				))}
			</ul>

			{data.reported.length > 0 && (
				<section className="mt-12">
					<h2 className="text-2xl font-extrabold">Reported as stopped</h2>
					<p className="mt-1 text-muted">
						Visitors said these have stopped. From {data.warnAt} reports, everyone sees a warning.
					</p>
					<ul className="mt-4 grid gap-3">
						{data.reported.map(({ listing, reports }) => (
							<li key={listing.id} className="panel p-4">
								<Link to="/listing/$slug" params={{ slug: listing.slug }} className="link">
									{listing.name}, {listing.venue.town}
								</Link>
								<p className="text-muted">
									{reports} report{reports === 1 ? '' : 's'}
								</p>
								<div className="mt-3 flex flex-wrap gap-2">
									<button
										type="button"
										className="btn-small"
										onClick={async () => {
											await confirmListing({ data: { listingId: listing.id, kind: 'running' } })
											setMessage(`Marked ${listing.name} as still on.`)
											await router.invalidate()
										}}
									>
										It’s still on
									</button>
									<button
										type="button"
										className="btn-small"
										onClick={async () => {
											const result = await setListingHidden({
												data: { listingId: listing.id, hidden: true },
											})
											setMessage(result.ok ? `Took down ${listing.name}.` : result.message)
											await router.invalidate()
										}}
									>
										Take it down
									</button>
								</div>
							</li>
						))}
					</ul>
				</section>
			)}

			<section className="mt-12 border-t border-edge pt-6">
				<h2 className="text-2xl font-extrabold">Map positions</h2>
				<p className="mt-1 text-muted">
					The launch listings have rough map positions. This looks each one up from its postcode.
				</p>
				<button
					type="button"
					className="btn-quiet mt-3"
					onClick={async () => {
						const result = await refreshMapPositions()
						setMessage(
							result.ok
								? `Updated ${result.updated} map positions. ${result.missed ? `${result.missed} postcodes weren’t found.` : ''}`
								: result.message,
						)
						await router.invalidate()
					}}
				>
					<Icon name="pin" />
					Look up map positions
				</button>
			</section>
		</div>
	)
}

function Suggestion({
	item,
	today,
	categories,
	onDone,
}: {
	item: QueueItem
	today: string
	categories: Parameters<typeof describeField>[3]
	onDone: (message: string) => Promise<void>
}) {
	const [note, setNote] = useState('')
	const [busy, setBusy] = useState(false)
	const { suggestion, contributor, listing, preview } = item
	const fields =
		suggestion.kind === 'new'
			? DETAIL_FIELDS.filter((f) => preview && preview[f] !== undefined)
			: changedFields(suggestion.changes)
	const title =
		suggestion.kind === 'new'
			? `New: ${preview?.name ?? 'listing'}`
			: suggestion.kind === 'claim'
				? `Wants to look after ${listing?.name ?? 'a listing'}`
				: `Changes to ${listing?.name ?? 'a listing'}`

	async function decide(decision: 'approve' | 'reject') {
		setBusy(true)
		const result = await reviewSuggestion({
			data: { id: suggestion.id, decision, note: note || undefined },
		})
		setBusy(false)
		await onDone(result.ok ? (decision === 'approve' ? 'Approved.' : 'Not used.') : result.message)
	}

	return (
		<article className="panel p-5">
			<div className="flex flex-wrap items-start justify-between gap-2">
				<h2 className="font-sans text-xl font-bold">{title}</h2>
				<span
					className={`tag ${contributor.trust === 'new' ? 'bg-sun-soft text-ink' : 'bg-teal-soft text-teal'}`}
				>
					{TRUST[contributor.trust]}
				</span>
			</div>
			<p className="text-sm text-muted">
				From {contributor.name ?? 'someone'} ({contributor.email}),{' '}
				{describeDate(suggestion.createdAt.slice(0, 10), today)}. {contributor.approved} approved,{' '}
				{contributor.rejected} not used before.
			</p>
			{listing && (
				<Link to="/listing/$slug" params={{ slug: listing.slug }} className="link text-sm">
					See the listing as it is now
				</Link>
			)}
			{suggestion.message && <p className="mt-3 rounded-xl bg-paper p-3">“{suggestion.message}”</p>}
			{item.problem && <p className="mt-3 font-bold text-coral">{item.problem}</p>}
			{item.conflicts.length > 0 && (
				<p className="mt-3 font-bold text-coral">
					Someone else changed the{' '}
					{item.conflicts.map((f) => FIELD_NAMES[f as keyof typeof FIELD_NAMES]).join(' and ')}{' '}
					since. Check these carefully.
				</p>
			)}
			{preview && (
				<dl className="mt-4 grid gap-3">
					{fields.map((field) => (
						<div key={field} className="grid gap-1 sm:grid-cols-[9rem_1fr]">
							<dt className="font-bold capitalize">{FIELD_NAMES[field]}</dt>
							<dd>
								{listing && suggestion.kind === 'change' && (
									<p className="text-muted line-through">
										{describeField(field, listing, today, categories)}
									</p>
								)}
								<p>{describeField(field, preview, today, categories)}</p>
							</dd>
						</div>
					))}
				</dl>
			)}
			<label className="mt-4 block">
				<span className="label text-sm">Note to them (optional)</span>
				<input
					className="field"
					value={note}
					onChange={(e) => setNote(e.target.value)}
					maxLength={500}
				/>
			</label>
			<div className="mt-3 flex flex-wrap gap-2">
				<button
					type="button"
					className="btn-primary"
					disabled={busy || !!item.problem}
					onClick={() => decide('approve')}
				>
					<Icon name="check" />
					Approve
				</button>
				<button
					type="button"
					className="btn-quiet"
					disabled={busy}
					onClick={() => decide('reject')}
				>
					Don’t use it
				</button>
			</div>
		</article>
	)
}
