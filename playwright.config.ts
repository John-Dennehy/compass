import { defineConfig, devices } from '@playwright/test'

const PORT = 3100

export default defineConfig({
	testDir: './e2e',
	// The tests share one server and its memory store, so they run in order.
	fullyParallel: false,
	workers: 1,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? 'github' : 'list',
	use: {
		baseURL: `http://localhost:${PORT}`,
		trace: 'retain-on-failure',
		launchOptions: process.env.CHROMIUM_PATH
			? { executablePath: process.env.CHROMIUM_PATH }
			: undefined,
	},
	projects: [
		{ name: 'desktop', use: { ...devices['Desktop Chrome'] } },
		{ name: 'mobile', use: { ...devices['Pixel 7'] } },
	],
	webServer: {
		// No DATABASE_URL or RESEND_API_KEY: memory storage, and sign-in links shown on the page.
		command: `VITE_GOOGLE_MAPS_API_KEY= pnpm build && PORT=${PORT} DATABASE_URL= RESEND_API_KEY= COMPASS_SHOW_SIGN_IN_LINKS=1 SESSION_SECRET=e2e-only-secret-that-is-long-enough-123 MODERATOR_EMAILS=moderator@example.com pnpm start`,
		url: `http://localhost:${PORT}`,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000,
	},
})
