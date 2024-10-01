import { defineConfig, devices } from "@playwright/test";

const baseURL = `http://${process.env.INTEGRATION_TEST_HOST || "localhost"}:3000`;
/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
	testDir: "./playwright",
	/* Don't run tests inside files in parallel */
	fullyParallel: false,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Retry on CI only */
	retries: process.env.CI ? 2 : 0,
	/** try running in parallel on CI too */
	workers: undefined,
	expect: {
		timeout: process.env.CI ? 5_000 : 60_000,
	},
	// a
	webServer: [
		{
			command: process.env.CI
				? `echo ${baseURL}`
				: `pnpm --workspace-root exec preconstruct build && ${
						process.env.TEST_DEV
							? "pnpm --filter core dev"
							: "pnpm --filter core build && pnpm --filter core start"
					}`,
			timeout: 600_000,
			url: baseURL,
			stderr: "pipe",
			stdout: "pipe",
			reuseExistingServer: true,
		},
	],
	// max 20 seconds per test in CI
	timeout: process.env.CI ? 20 * 1000 : 10 * 60 * 1000,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: process.env.CI ? "list" : "html",
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		baseURL,

		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: "on-first-retry",
	},

	/* Configure projects for major browsers */
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
});
