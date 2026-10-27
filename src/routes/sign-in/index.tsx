import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { Icon } from '@/components/Icon'
import { requestSignIn } from '@/server/api'

export const Route = createFileRoute('/sign-in/')({
	validateSearch: z.object({ next: z.string().max(300).optional() }),
	head: () => ({ meta: [{ title: 'Sign in · Compass' }] }),
	component: SignInPage,
})

function SignInPage() {
	const { next } = Route.useSearch()
	const [state, setState] = useState<
		{ kind: 'form' } | { kind: 'sent'; email: string; link: string | null }
	>({
		kind: 'form',
	})
	const [error, setError] = useState<string | null>(null)
	const [busy, setBusy] = useState(false)

	if (state.kind === 'sent') {
		return (
			<div className="mx-auto max-w-xl py-6">
				<Icon name="check" className="size-12 text-teal" />
				<h1 className="mt-3 text-4xl font-extrabold">Check your email</h1>
				<p className="mt-3 text-lg">
					We’ve sent a link to <strong>{state.email}</strong>. Open it on this phone or computer to
					sign in. It works once, for the next 30 minutes.
				</p>
				{state.link && (
					<div className="mt-6 rounded-2xl bg-sun-soft p-4">
						<p className="font-bold">Email isn’t set up here, so here’s the link:</p>
						<a href={state.link} className="link break-all">
							Finish signing in
						</a>
					</div>
				)}
				<button type="button" className="btn-quiet mt-6" onClick={() => setState({ kind: 'form' })}>
					Use a different email
				</button>
			</div>
		)
	}

	return (
		<div className="mx-auto max-w-xl">
			<h1 className="text-4xl font-extrabold">Sign in</h1>
			<p className="mt-3 text-lg">
				You only need to sign in to add listings or suggest changes. Saying something is still on
				works without it.
			</p>
			<p className="mt-2 text-muted">
				There’s no password: we email you a link. Your email address is never shown to anyone.
			</p>
			<form
				className="mt-6 grid gap-4"
				onSubmit={async (e) => {
					e.preventDefault()
					const form = new FormData(e.currentTarget)
					const email = String(form.get('email') ?? '').trim()
					setBusy(true)
					setError(null)
					try {
						const result = await requestSignIn({
							data: { email, name: String(form.get('name') ?? '').trim() || undefined, next },
						})
						if (result.ok) setState({ kind: 'sent', email, link: result.link })
						else setError(result.message)
					} catch {
						setError('Please check your email address and try again.')
					} finally {
						setBusy(false)
					}
				}}
			>
				<label className="block">
					<span className="label">Email address</span>
					<input name="email" type="email" required autoComplete="email" className="field" />
				</label>
				<label className="block">
					<span className="label">Your first name</span>
					<span className="hint mb-1 block">Optional. Only moderators see it.</span>
					<input name="name" autoComplete="given-name" maxLength={60} className="field" />
				</label>
				{error && (
					<p role="alert" className="font-bold text-coral">
						{error}
					</p>
				)}
				<button type="submit" className="btn-primary justify-self-start" disabled={busy}>
					{busy ? 'Sending…' : 'Email me a link'}
				</button>
			</form>
			<p className="mt-8 text-muted">
				<Link to="/about" className="link">
					How Compass uses your details
				</Link>
			</p>
		</div>
	)
}
