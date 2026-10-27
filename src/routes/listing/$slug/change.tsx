import { createFileRoute, Link, notFound, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Icon } from '@/components/Icon'
import { ListingForm } from '@/components/ListingForm'
import { SignInFirst } from '@/components/SignInFirst'
import { detailsOf } from '@/core/changes'
import { fromDetails } from '@/lib/draft'
import { getListingPage, suggestListingChange } from '@/server/api'

export const Route = createFileRoute('/listing/$slug/change')({
	loader: async ({ params }) => {
		const page = await getListingPage({ data: { slug: params.slug } })
		if (!page) throw notFound()
		return page
	},
	head: ({ loaderData }) => ({
		meta: [{ title: `Change ${loaderData?.listing.name ?? 'a listing'} · Compass` }],
	}),
	component: ChangePage,
})

function ChangePage() {
	const page = Route.useLoaderData()
	const router = useRouter()
	const { listing } = page
	const [done, setDone] = useState<'saved' | 'queued' | null>(null)
	const direct = page.trust === 'organiser' || page.trust === 'moderator'

	if (done) {
		return (
			<div className="mx-auto max-w-2xl py-10 text-center">
				<Icon name="check" className="mx-auto size-12 text-teal" />
				<h1 className="mt-4 text-4xl font-extrabold">
					{done === 'saved' ? 'Saved' : 'Thank you!'}
				</h1>
				<p className="mt-3 text-lg">
					{done === 'saved'
						? 'Your changes are live, and they’re in the listing’s history.'
						: 'A moderator will check your changes, usually within a few days. Until then the listing stays as it was.'}
				</p>
				<Link to="/listing/$slug" params={{ slug: listing.slug }} className="btn-primary mt-8">
					Back to {listing.name}
				</Link>
			</div>
		)
	}

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
			<h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">What’s changed?</h1>
			<p className="mt-2 text-lg text-muted">
				Change anything that’s wrong below.{' '}
				{direct
					? 'You look after this listing, so your changes go live straight away.'
					: 'A moderator checks changes before they go live.'}
			</p>
			<SignInFirst
				next={`/listing/${listing.slug}/change`}
				why="So moderators know who suggested a change, and can ask if anything is unclear. If it has simply stopped, you can say so on the listing without signing in."
			>
				<div className="mt-8">
					<ListingForm
						initial={fromDetails(detailsOf(listing))}
						towns={page.area.towns}
						categories={page.categories}
						submitLabel={direct ? 'Save changes' : 'Send changes to be checked'}
						extra={
							!direct && (
								<section className="grid gap-4">
									<h2 className="text-2xl font-extrabold">How do you know?</h2>
									<label className="block">
										<span className="label">A note for the moderators</span>
										<span className="hint mb-1 block">
											Optional. Like “I went last week” or “It’s on their Facebook page”.
										</span>
										<textarea name="message" className="field min-h-24" maxLength={1000} />
									</label>
								</section>
							)
						}
						onSubmit={async (details, form) => {
							const result = await suggestListingChange({
								data: {
									listingId: listing.id,
									baseVersion: listing.version,
									details,
									message: String(form.get('message') ?? '') || undefined,
									website: String(form.get('website') ?? '') || undefined,
								},
							})
							if (!result.ok) return result.message
							await router.invalidate()
							setDone(result.status === 'saved' ? 'saved' : 'queued')
							window.scrollTo({ top: 0 })
							return null
						}}
					/>
				</div>
			</SignInFirst>
		</div>
	)
}
