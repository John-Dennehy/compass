import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useMe } from '@/components/SignInFirst'
import { describeDate, localNow } from '@/core/dates'
import { TRUSTED_AFTER } from '@/core/trust'
import { getMySuggestions, signOut } from '@/server/api'

export const Route = createFileRoute('/me')({
	loader: () => getMySuggestions(),
	head: () => ({ meta: [{ title: 'Your page · Compass' }] }),
	component: MePage,
})

const KIND = { new: 'New listing', change: 'Changes to', claim: 'Looking after' } as const
const STATUS = {
	pending: 'Waiting to be checked',
	approved: 'Approved',
	rejected: 'Not used',
} as const

function MePage() {
	const me = useMe()
	const suggestions = Route.useLoaderData()
	const router = useRouter()
	const navigate = useNavigate()
	const today = localNow(new Date()).date

	if (!me || !suggestions) {
		return (
			<div className="mx-auto max-w-xl">
				<h1 className="text-4xl font-extrabold">You’re not signed in</h1>
				<Link to="/sign-in" className="btn-primary mt-6">
					Sign in
				</Link>
			</div>
		)
	}

	return (
		<div className="mx-auto max-w-2xl">
			<h1 className="text-4xl font-extrabold">Hello{me.name ? `, ${me.name}` : ''}</h1>
			<p className="mt-2 text-muted">Signed in as {me.email}.</p>
			<p className="mt-4 text-lg">
				{me.moderator
					? 'You’re a moderator, so your changes go live straight away.'
					: me.trust === 'trusted'
						? 'Your suggestions go to the front of the queue, because so many have been right. Thank you.'
						: `Once ${TRUSTED_AFTER} of your suggestions have been approved, yours go to the front of the queue.`}
			</p>

			<h2 className="mt-10 text-2xl font-extrabold">Your suggestions</h2>
			{suggestions.length === 0 ? (
				<p className="mt-3 text-muted">
					None yet.{' '}
					<Link to="/add" className="link">
						Add something
					</Link>
				</p>
			) : (
				<ul className="mt-3 grid gap-3">
					{suggestions.map((s) => (
						<li key={s.id} className="panel p-4">
							<p className="font-bold">
								{KIND[s.kind]} {s.name}
							</p>
							<p className="text-muted">
								{describeDate(s.createdAt.slice(0, 10), today)} ·{' '}
								<span className={s.status === 'approved' ? 'font-bold text-teal' : ''}>
									{STATUS[s.status]}
								</span>
							</p>
							{s.reviewNote && <p className="mt-1">Moderator’s note: “{s.reviewNote}”</p>}
						</li>
					))}
				</ul>
			)}

			<button
				type="button"
				className="btn-quiet mt-10"
				onClick={async () => {
					await signOut()
					await router.invalidate()
					await navigate({ to: '/' })
				}}
			>
				Sign out
			</button>
		</div>
	)
}
