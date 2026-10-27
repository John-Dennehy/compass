import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useState } from 'react'
import { Icon } from '@/components/Icon'
import { SignInFirst } from '@/components/SignInFirst'
import { claimListing, getListingPage } from '@/server/api'

export const Route = createFileRoute('/listing/$slug/claim')({
	loader: async ({ params }) => {
		const page = await getListingPage({ data: { slug: params.slug } })
		if (!page) throw notFound()
		return page
	},
	head: ({ loaderData }) => ({
		meta: [{ title: `Look after ${loaderData?.listing.name ?? 'a listing'} · Compass` }],
	}),
	component: ClaimPage,
})

function ClaimPage() {
	const { listing } = Route.useLoaderData()
	const [sent, setSent] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [busy, setBusy] = useState(false)

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
			<h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">Do you run {listing.name}?</h1>
			<p className="mt-3 text-lg">
				Organisers can keep their own listing up to date. Your changes go live straight away, and
				the listing gets a badge so parents know it comes from you.
			</p>
			<SignInFirst
				next={`/listing/${listing.slug}/claim`}
				why="So we know who looks after the listing."
			>
				{sent ? (
					<p role="status" className="panel mt-6 flex items-center gap-2 p-5 font-bold text-teal">
						<Icon name="check" />
						Thanks. A moderator will check and get back to you by email.
					</p>
				) : (
					<form
						className="mt-6 grid gap-4"
						onSubmit={async (e) => {
							e.preventDefault()
							const form = new FormData(e.currentTarget)
							setBusy(true)
							try {
								const result = await claimListing({
									data: {
										listingId: listing.id,
										message: String(form.get('message') ?? ''),
										website: String(form.get('website') ?? '') || undefined,
									},
								})
								if (result.ok) setSent(true)
								else setError(result.message)
							} catch {
								setError('Please tell us a little more, then try again.')
							} finally {
								setBusy(false)
							}
						}}
					>
						<label className="block">
							<span className="label">How can we check it’s you?</span>
							<span className="hint mb-1 block">
								For example your role, and the group’s Facebook page or email where we can reach
								you. Only moderators see this.
							</span>
							<textarea
								name="message"
								required
								minLength={10}
								maxLength={1000}
								className="field min-h-32"
							/>
						</label>
						<div aria-hidden className="absolute -left-[9999px]">
							<input name="website" tabIndex={-1} autoComplete="off" />
						</div>
						{error && (
							<p role="alert" className="font-bold text-coral">
								{error}
							</p>
						)}
						<button type="submit" className="btn-primary justify-self-start" disabled={busy}>
							Send
						</button>
					</form>
				)}
			</SignInFirst>
		</div>
	)
}
