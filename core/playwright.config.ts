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
	// multiple workers in CI is too flaky for now
	workers: process.env.CI ? 1 : undefined,
	expect: {
		timeout: process.env.CI ? 5_000 : 60_000,
	},

	// don't continue going after 3 tests have failed, that's too many
	maxFailures: process.env.CI ? 3 : undefined,
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
	// max 30 seconds per test in CI
	timeout: process.env.CI ? 30 * 1000 : 10 * 60 * 1000,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: process.env.CI ? "github" : "list",
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		baseURL,
		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},

	/* Configure projects for major browsers */
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
});
