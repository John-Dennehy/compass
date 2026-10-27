import { expect, type Page, test } from '@playwright/test'

const unique = () => Math.random().toString(36).slice(2, 8)

/** Signs in through the emailed link, which the test server shows on the page. */
async function signIn(page: Page, email: string, next = '/') {
	await page.goto(`/sign-in?next=${encodeURIComponent(next)}`)
	await page.getByLabel('Email address').fill(email)
	await page.getByRole('button', { name: 'Email me a link' }).click()
	await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible()
	await page.getByRole('link', { name: 'Finish signing in' }).click()
	await page.getByRole('button', { name: 'Finish signing in' }).click()
	await page.waitForURL((url) => url.pathname === next)
}

test('the week shows each day’s sessions, with filters', async ({ page }) => {
	await page.goto('/')
	await expect(page.getByRole('heading', { level: 1, name: 'This week' })).toBeVisible()
	await expect(page.getByRole('navigation', { name: 'Days' }).getByRole('link')).toHaveCount(7)

	// Footprints is the only free regular group, and it's on Wednesdays.
	const filters = page.getByRole('button', { name: /Filter by age/ })
	if (await filters.isVisible()) await filters.click()
	await page.getByLabel('Free only').check()
	await expect(page).toHaveURL(/free=true/)
	// Other tests may add free events, so only check the paid groups have gone.
	await expect(page.getByText(/this week from \d+ listing/)).toBeVisible()
	await expect(page.getByRole('link', { name: /Butterflies Toddler Group/ })).toHaveCount(0)
	await page.locator('details').evaluateAll((all) => {
		for (const d of all) d.setAttribute('open', '')
	})
	await expect(page.getByRole('link', { name: /Footprints Group/ })).toBeVisible()

	// Next week keeps the filters.
	await page.getByRole('link', { name: 'The week after' }).click()
	await expect(page.getByRole('heading', { level: 1, name: 'Next week' })).toBeVisible()
	await expect(page).toHaveURL(/free=true/)
})

test('a listing says when it’s on and how to get there, and anyone can confirm it', async ({
	page,
}) => {
	await page.goto('/listing/butterflies-toddler-group-salvation-army')
	await expect(
		page.getByRole('heading', { level: 1, name: 'Butterflies Toddler Group' }),
	).toBeVisible()
	await expect(page.getByText('Mondays, Wednesdays and Thursdays, 10am to 12pm')).toBeVisible()
	const maps = page.getByRole('link', { name: 'Open in Google Maps' })
	await expect(maps).toHaveAttribute(
		'href',
		/google\.com\/maps\/search\/\?api=1&query=Salvation%20Army/,
	)
	await page.getByRole('button', { name: 'Yes, it’s still on' }).click()
	await expect(page.getByRole('status')).toContainText('marked it as checked today')
	await expect(page.getByText(/Checked today by someone who went/)).toBeVisible()
})

test('search finds listings by words', async ({ page }) => {
	await page.goto('/search')
	await page.getByLabel('Name, place or anything else').fill('rhymetime sunbury')
	await expect(page).toHaveURL(/q=rhymetime/)
	await expect(page.getByText('1 result', { exact: true })).toBeVisible()
	await expect(page.getByRole('link', { name: /Rhymetime.*Sunbury Library/ })).toBeVisible()
})

test('a suggested change waits for a moderator, then appears with its history', async ({
	browser,
}) => {
	const note = `Bring a snack ${unique()}`
	const parent = await (await browser.newContext()).newPage()
	await parent.goto('/listing/minnows-toddler-group-staines-methodist-church')
	await parent.getByRole('link', { name: 'Something’s changed' }).click()
	await parent.getByRole('link', { name: 'Sign in with your email' }).click()
	await expect(parent).toHaveURL(/next=/)
	await signIn(
		parent,
		`parent-${unique()}@example.com`,
		'/listing/minnows-toddler-group-staines-methodist-church/change',
	)
	await parent.getByLabel('Anything else people should know').fill(note)
	await parent.getByLabel('A note for the moderators').fill('I went last week')
	await parent.getByRole('button', { name: 'Send changes to be checked' }).click()
	await expect(parent.getByRole('heading', { name: 'Thank you!' })).toBeVisible()

	const moderator = await (await browser.newContext()).newPage()
	await signIn(moderator, 'moderator@example.com', '/moderate')
	const item = moderator.getByRole('article').filter({ hasText: note })
	await expect(item).toContainText('Changes to Minnows Toddler Group')
	await expect(item).toContainText('I went last week')
	await item.getByRole('button', { name: 'Approve' }).click()
	await expect(moderator.getByRole('status')).toHaveText('Approved.')

	await parent.goto('/listing/minnows-toddler-group-staines-methodist-church')
	await expect(parent.getByText(note)).toBeVisible()
	await parent.getByRole('link', { name: 'See the history' }).click()
	await expect(
		parent.getByText('Suggested by a contributor and checked by a moderator.').first(),
	).toBeVisible()
	// What they told the moderator stays private.
	await expect(parent.getByText('I went last week')).toHaveCount(0)
})

test('a moderator can add a one-off event, and it shows as coming up', async ({ page }) => {
	const name = `Autumn Fair ${unique()}`
	await signIn(page, 'moderator@example.com', '/add')
	await page.getByLabel('It’s a one-off event').check()
	await page.getByLabel('Name', { exact: true }).fill(name)
	await page.getByLabel('Kind of thing').selectOption({ label: 'Family events' })
	await page.getByLabel('In your own words').fill('All families')
	await page.getByLabel('Any age, including grown-ups').check()
	await page.getByLabel('Name of the place').fill('Ashford Recreation Ground')
	await page.getByLabel('Address').fill('Clarendon Road, Ashford')
	await page.getByLabel('Town').selectOption('Ashford')
	const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
	await page.getByLabel('Date', { exact: true }).fill(soon)
	await page.getByLabel('Starts').fill('11:00')
	await page.getByLabel('Ends').fill('15:00')
	await page.getByLabel('Cost', { exact: true }).selectOption('free')
	await page.getByRole('button', { name: 'Add it now' }).click()
	await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
	await expect(page.getByText('One-off event')).toBeVisible()

	await page.goto('/coming-up')
	await expect(page.getByRole('link', { name: new RegExp(name) })).toBeVisible()
})

test('the form explains what’s missing', async ({ page }) => {
	await signIn(page, `parent-${unique()}@example.com`, '/add')
	await page.getByLabel('Name', { exact: true }).fill('Tiny Tumblers')
	await page.getByRole('button', { name: 'Send it to be checked' }).click()
	await expect(page.getByRole('alert')).toHaveText(/Please choose one|Please fill this in/)
})

test('moderation is for moderators only', async ({ page }) => {
	await page.goto('/moderate')
	await expect(page.getByRole('heading', { name: 'Moderators only' })).toBeVisible()
	await signIn(page, `parent-${unique()}@example.com`, '/moderate')
	await expect(page.getByRole('heading', { name: 'Moderators only' })).toBeVisible()
})
