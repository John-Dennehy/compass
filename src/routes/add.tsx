import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { Icon } from '@/components/Icon'
import { ListingForm } from '@/components/ListingForm'
import { SignInFirst, useMe } from '@/components/SignInFirst'
import { emptyDraft } from '@/lib/draft'
import { getAreaData, suggestNewListing } from '@/server/api'

export const Route = createFileRoute('/add')({
	validateSearch: z.object({
		kind: z.enum(['regular', 'one-off']).optional(),
		area: z.string().max(40).optional(),
	}),
	loaderDeps: ({ search }) => ({ area: search.area }),
	loader: ({ deps }) => getAreaData({ data: { area: deps.area } }),
	head: () => ({ meta: [{ title: 'Add something · Compass' }] }),
	component: AddPage,
})

function AddPage() {
	const data = Route.useLoaderData()
	const { kind } = Route.useSearch()
	const me = useMe()
	const navigate = useNavigate()
	const router = useRouter()
	const [queued, setQueued] = useState(false)
	if (!data) return <p>We couldn’t find that area.</p>

	if (queued) {
		return (
			<div className="mx-auto max-w-2xl py-10 text-center">
				<Icon name="check" className="mx-auto size-12 text-teal" />
				<h1 className="mt-4 text-4xl font-extrabold">Thank you!</h1>
				<p className="mt-3 text-lg">
					A moderator will check it, usually within a few days, and then it’ll be on Compass for
					everyone. You can see how it’s going on{' '}
					<Link to="/me" className="link">
						your page
					</Link>
					.
				</p>
				<div className="mt-8 flex justify-center gap-3">
					<button type="button" className="btn-quiet" onClick={() => setQueued(false)}>
						Add something else
					</button>
					<Link to="/" className="btn-primary">
						Back to the week
					</Link>
				</div>
			</div>
		)
	}

	return (
		<div className="mx-auto max-w-2xl">
			<h1 className="text-4xl font-extrabold sm:text-5xl">Add something</h1>
			<p className="mt-2 text-lg text-muted">
				A group, class or event for families in {data.area.name}. A moderator checks new listings
				before they go up.
			</p>
			<SignInFirst
				next="/add"
				why="So we can let you know when it’s up, and so moderators know who to ask if anything is unclear."
			>
				<div className="mt-8">
					<ListingForm
						initial={emptyDraft(kind ?? 'regular')}
						towns={data.area.towns}
						categories={data.categories}
						submitLabel={me?.moderator ? 'Add it now' : 'Send it to be checked'}
						extra={
							<section className="grid gap-4">
								<h2 className="text-2xl font-extrabold">Anything for the moderators?</h2>
								<label className="block">
									<span className="label">How do you know about it?</span>
									<span className="hint mb-1 block">
										Optional, but it helps. Only moderators see this.
									</span>
									<textarea name="message" className="field min-h-24" maxLength={1000} />
								</label>
								<label className="flex min-h-12 items-center gap-3 font-bold">
									<input type="checkbox" name="organiser" className="size-6 accent-teal" />I run
									this
								</label>
							</section>
						}
						onSubmit={async (details, form) => {
							const result = await suggestNewListing({
								data: {
									areaId: data.area.id,
									details,
									message: String(form.get('message') ?? '') || undefined,
									organiser: form.get('organiser') === 'on',
									website: String(form.get('website') ?? '') || undefined,
								},
							})
							if (!result.ok) return result.message
							if (result.status === 'added' && 'slug' in result && result.slug) {
								await router.invalidate()
								await navigate({ to: '/listing/$slug', params: { slug: result.slug } })
								return null
							}
							setQueued(true)
							window.scrollTo({ top: 0 })
							return null
						}}
					/>
				</div>
			</SignInFirst>
		</div>
	)
}
