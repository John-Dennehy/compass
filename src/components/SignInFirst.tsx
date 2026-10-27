import { getRouteApi, Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

const root = getRouteApi('__root__')

/** Shows its children to signed-in people, and a short explanation to everyone else. */
export function SignInFirst({
	next,
	why,
	children,
}: {
	next: string
	why: string
	children: ReactNode
}) {
	const me = root.useLoaderData()
	if (me) return <>{children}</>
	return (
		<div className="panel mt-6 p-6">
			<h2 className="text-2xl font-extrabold">Sign in first</h2>
			<p className="mt-2 max-w-xl">{why}</p>
			<p className="mt-2 max-w-xl text-muted">
				We’ll email you a link, so there’s no password to remember. We never show your email address
				to anyone.
			</p>
			<Link to="/sign-in" search={{ next }} className="btn-primary mt-5">
				Sign in with your email
			</Link>
		</div>
	)
}

export function useMe() {
	return root.useLoaderData()
}
