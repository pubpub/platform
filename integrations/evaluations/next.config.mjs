// @ts-check

/** @type {import('next').NextConfig} */
import withPreconstruct from "@preconstruct/next";
import { withSentryConfig } from "@sentry/nextjs";

import "./lib/env.mjs";

/**
 * @type {import('next').NextConfig}
 */

const nextConfig = {
	output: "standalone",
	basePath: process.env.DOCKERBUILD ? "/intg/evaluations" : undefined,
	assetPrefix: process.env.DOCKERBUILD ? "/intg/evaluations/" : undefined,
	reactStrictMode: true,
	experimental: {
		instrumentationHook: true,
	},
};

export default withPreconstruct(
	withSentryConfig(nextConfig, {
		// For all available options, see:
		// https://github.com/getsentry/sentry-webpack-plugin#options

		// Suppresses source map uploading logs during build
		silent: true,
		org: "kfg",
		project: "v7-evaluations",
		// For all available options, see:
		// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

		// Upload a larger set of source maps for prettier stack traces (increases build time)
		widenClientFileUpload: true,

		// Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
		// tunnelRoute: "/monitoring",

		// Hides source maps from generated client bundles
		hideSourceMaps: true,

		// Automatically tree-shake Sentry logger statements to reduce bundle size
		disableLogger: true,
	})
);
