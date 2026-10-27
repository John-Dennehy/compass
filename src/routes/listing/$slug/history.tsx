import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { Icon } from '@/components/Icon'
import { type Changes, changedFields } from '@/core/changes'
import { describeDate, localNow } from '@/core/dates'
import { FIELD_NAMES } from '@/core/listing'
import { getListingHistory } from '@/server/api'

export const Route = createFileRoute('/listing/$slug/history')({
	loader: async ({ params }) => {
		const history = await getListingHistory({ data: { slug: params.slug } })
		if (!history) throw notFound()
		return history
	},
	head: ({ loaderData }) => ({
		meta: [{ title: `History of ${loaderData?.listing.name ?? 'a listing'} · Compass` }],
	}),
	component: HistoryPage,
})

function summarise(changes: Changes): string | null {
	const fields = changedFields(changes).map((f) => FIELD_NAMES[f])
	if (!fields.length) return null
	const list =
		fields.length > 1 ? `${fields.slice(0, -1).join(', ')} and ${fields.at(-1)}` : fields[0]
	return `Changed the ${list}.`
}

function HistoryPage() {
	const { listing, revisions } = Route.useLoaderData()
	const today = localNow(new Date()).date
	return (
		<div className="mx-auto max-w-2xl">
			<Link
				to="/listing/$slug"
				params={{ slug: listing.slug }}
				className="link inline-flex items-center gap-1"
			>
				<Icon name="left" className="size-4" />
				{listing.name}
			</Link>
			<h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">History</h1>
			<p className="mt-2 text-lg text-muted">
				Every change to this listing, newest first. Nobody’s name or email is shown.
			</p>
			<ol className="mt-6 grid gap-3">
				{revisions.map((r) => (
					<li key={r.version} className="panel p-4">
						<p className="font-bold">{describeDate(r.at.slice(0, 10), today)}</p>
						<p>{r.who}.</p>
						{summarise(r.changes) && <p className="mt-1">{summarise(r.changes)}</p>}
						{r.note && <p className="mt-1 text-muted">“{r.note}”</p>}
					</li>
				))}
			</ol>
		</div>
	)
}
