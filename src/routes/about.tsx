import { createFileRoute, Link } from '@tanstack/react-router'
import { RECENT_DAYS, STALE_DAYS } from '@/core/freshness'
import { TRUSTED_AFTER } from '@/core/trust'

export const Route = createFileRoute('/about')({
	head: () => ({ meta: [{ title: 'About · Compass' }] }),
	component: About,
})

function About() {
	return (
		<article className="mx-auto max-w-2xl text-lg leading-relaxed">
			<h1 className="text-4xl font-extrabold sm:text-5xl">About Compass</h1>
			<p className="mt-4">
				Compass shows what’s on for families near you, week by week: playgroups, baby groups,
				rhymetime, classes and one-off events. Most families plan around a regular week, so the week
				is the first thing you see.
			</p>

			<h2 className="mt-10 text-2xl font-extrabold">Where the listings come from</h2>
			<p className="mt-3">
				The first listings come from Spelthorne’s playgroups leaflet from September 2025. After
				that, they’re kept up to date by the people who use them: parents, carers, grandparents and
				the organisers themselves.
			</p>

			<h2 className="mt-10 text-2xl font-extrabold">How we keep it right</h2>
			<ul className="mt-3 grid list-disc gap-2 pl-6">
				<li>
					Every listing says when it was last checked, and who by. Anything not checked for{' '}
					{Math.round(RECENT_DAYS / 30)} months asks you to check before you go, and after{' '}
					{Math.round(STALE_DAYS / 30)} months it says so clearly.
				</li>
				<li>Anyone can tap “still on” or “it’s stopped” after they go. No sign-in needed.</li>
				<li>
					If two people say something has stopped, everyone sees a warning, and a moderator takes a
					look.
				</li>
				<li>
					Suggested changes and new listings are checked by a moderator before they go live. People
					whose last {TRUSTED_AFTER} or more suggestions were right go to the front of the queue.
				</li>
				<li>
					Organisers can look after their own listing. Their changes go live straight away, and the
					listing gets a badge.
				</li>
				<li>
					Every change is kept in the listing’s history, so a mistake can always be put right.
				</li>
				<li>
					Term-time groups know the school holidays, from{' '}
					<a
						className="link"
						href="https://www.surreycc.gov.uk/schools-and-learning/schools/term-dates"
					>
						Surrey County Council’s term dates
					</a>
					.
				</li>
			</ul>

			<h2 className="mt-10 text-2xl font-extrabold">Your details</h2>
			<p className="mt-3">
				You don’t need an account to look around or to say something is still on. A cookie remembers
				your answers for a week so they’re only counted once. To add or change listings you sign in
				with an email link. Only moderators see your email address and name, and we use them only to
				ask about your suggestion or tell you it’s been checked. The public history never shows who
				made a change.
			</p>

			<h2 className="mt-10 text-2xl font-extrabold">Who made it</h2>
			<p className="mt-3">
				Compass is made by{' '}
				<a className="link" href="https://johndennehy.dev">
					John Dennehy
				</a>
				, and the code is{' '}
				<a className="link" href="https://github.com/John-Dennehy/compass">
					on GitHub
				</a>
				. Spotted something wrong?{' '}
				<Link to="/search" className="link">
					Find the listing
				</Link>{' '}
				and tap “Something’s changed”.
			</p>
		</article>
	)
}
