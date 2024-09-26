import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

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
	/* Opt out of parallel tests on CI. */
	workers: process.env.CI ? 1 : undefined,
	expect: {
		timeout: process.env.CI ? 5_000 : 60_000,
	},
	// a
	webServer: [
		{
			command: `pnpm --workspace-root exec preconstruct build && ${
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
	timeout: process.env.CI ? 30 * 1000 : 10 * 60 * 1000,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: "html",
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
