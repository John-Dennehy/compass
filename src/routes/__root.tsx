import {
	createRootRoute,
	HeadContent,
	Link,
	Outlet,
	Scripts,
	useRouterState,
} from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Icon, type IconName } from '@/components/Icon'
import { getMe } from '@/server/api'
import appCss from '../styles.css?url'

const description =
	'What’s on for families, week by week: playgroups, baby groups, rhymetime and family events, checked by the people who go.'

export const Route = createRootRoute({
	loader: () => getMe(),
	staleTime: 60_000,
	head: () => ({
		meta: [
			{ charSet: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
			{ title: 'Compass' },
			{ name: 'description', content: description },
			{ name: 'theme-color', content: '#0d6662' },
			{ property: 'og:site_name', content: 'Compass' },
			{ property: 'og:title', content: 'Compass' },
			{ property: 'og:description', content: description },
		],
		links: [
			{ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
			{ rel: 'preconnect', href: 'https://fonts.googleapis.com' },
			{ rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
			{
				rel: 'stylesheet',
				href: 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;700&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&display=swap',
			},
			{ rel: 'stylesheet', href: appCss },
		],
	}),
	component: RootLayout,
	shellComponent: RootDocument,
	notFoundComponent: NotFound,
})

function RootDocument({ children }: { children: ReactNode }) {
	return (
		<html lang="en-GB">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	)
}

const NAV: { to: '/' | '/coming-up' | '/search' | '/add'; label: string; icon: IconName }[] = [
	{ to: '/', label: 'Week', icon: 'calendar' },
	{ to: '/coming-up', label: 'Coming up', icon: 'star' },
	{ to: '/search', label: 'Search', icon: 'search' },
	{ to: '/add', label: 'Add', icon: 'plus' },
]

function RootLayout() {
	const me = Route.useLoaderData()
	const pending = useRouterState({ select: (s) => s.status === 'pending' })
	return (
		<div className="flex min-h-dvh flex-col">
			<a
				href="#main"
				className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-3 focus:font-bold"
			>
				Skip to the main part
			</a>
			<header className="border-b border-edge bg-surface">
				<div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
					<Link to="/" className="flex items-center gap-2 font-display text-2xl font-extrabold">
						<img src="/favicon.svg" alt="" className="size-9" />
						Compass
					</Link>
					<nav aria-label="Main" className="hidden gap-1 md:flex">
						{NAV.map((item) => (
							<Link
								key={item.to}
								to={item.to}
								activeOptions={{ exact: item.to === '/', includeSearch: false }}
								className="flex min-h-11 items-center gap-2 rounded-xl px-3 font-bold text-muted hover:text-ink [&.active]:bg-teal-soft [&.active]:text-teal"
							>
								<Icon name={item.icon} />
								{item.label}
							</Link>
						))}
					</nav>
					<div className="flex items-center gap-2 text-sm font-bold">
						{me?.moderator && (
							<Link to="/moderate" className="btn-small">
								Queue
							</Link>
						)}
						{me ? (
							<Link to="/me" className="btn-small" aria-label="Your account">
								<Icon name="person" />
								<span className="max-w-28 truncate">{me.name ?? 'You'}</span>
							</Link>
						) : (
							<Link to="/sign-in" className="btn-small">
								Sign in
							</Link>
						)}
					</div>
				</div>
			</header>
			<div
				aria-hidden
				className={`h-0.5 bg-teal transition-opacity ${pending ? 'animate-pulse opacity-100' : 'opacity-0'}`}
			/>
			<main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-28 md:pb-16">
				<Outlet />
			</main>
			<footer className="border-t border-edge px-4 pt-6 pb-28 text-center text-sm text-muted md:pb-8">
				<p>
					<Link to="/about" className="link">
						About Compass
					</Link>{' '}
					· Made by{' '}
					<a className="link" href="https://johndennehy.dev">
						John Dennehy
					</a>{' '}
					·{' '}
					<a className="link" href="https://github.com/John-Dennehy/compass">
						Source
					</a>
				</p>
			</footer>
			<nav
				aria-label="Main"
				className="fixed inset-x-0 bottom-0 z-40 border-t border-edge bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
			>
				<ul className="grid grid-cols-4">
					{NAV.map((item) => (
						<li key={item.to}>
							<Link
								to={item.to}
								activeOptions={{ exact: item.to === '/', includeSearch: false }}
								className="flex min-h-16 flex-col items-center justify-center gap-1 text-sm font-bold text-muted [&.active]:text-teal"
							>
								<Icon name={item.icon} className="size-6" />
								{item.label}
							</Link>
						</li>
					))}
				</ul>
			</nav>
		</div>
	)
}

function NotFound() {
	return (
		<div className="py-20 text-center">
			<h1 className="text-3xl font-extrabold">We can’t find that page</h1>
			<p className="mt-3 text-muted">It may have moved, or the listing may have been taken down.</p>
			<Link to="/" className="btn-primary mt-8">
				See this week
			</Link>
		</div>
	)
}
