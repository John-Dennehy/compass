import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { completeSignIn } from '@/server/api'

/**
 * Where the emailed link lands. Signing in takes a button press, because some email services
 * open links to scan them, which would otherwise use the link up.
 */
export const Route = createFileRoute('/sign-in/check')({
	validateSearch: z.object({ token: z.string().max(100).optional() }),
	head: () => ({ meta: [{ title: 'Sign in · Compass' }, { name: 'robots', content: 'noindex' }] }),
	component: CheckPage,
})

function CheckPage() {
	const { token } = Route.useSearch()
	const navigate = useNavigate()
	const router = useRouter()
	const [error, setError] = useState<string | null>(token ? null : 'That link is missing a part.')
	const [busy, setBusy] = useState(false)

	return (
		<div className="mx-auto max-w-xl py-6">
			<h1 className="text-4xl font-extrabold">Nearly there</h1>
			{error ? (
				<>
					<p role="alert" className="mt-3 text-lg font-bold text-coral">
						{error}
					</p>
					<a href="/sign-in" className="btn-primary mt-6">
						Get a new link
					</a>
				</>
			) : (
				<button
					type="button"
					className="btn-primary mt-6"
					disabled={busy}
					onClick={async () => {
						if (!token) return
						setBusy(true)
						const result = await completeSignIn({ data: { token } })
						if (!result.ok) {
							setError(result.message)
							setBusy(false)
							return
						}
						await router.invalidate()
						await navigate({ href: result.next, replace: true })
					}}
				>
					Finish signing in
				</button>
			)}
		</div>
	)
}
