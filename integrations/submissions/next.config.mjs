// @ts-check
import withPreconstruct from "@preconstruct/next";
import { withSentryConfig } from "@sentry/nextjs";

import "./lib/env.mjs";

const nextConfig = withPreconstruct(
	/** @type {import('next').NextConfig} */
	{
		output: "standalone",
		basePath: process.env.DOCKERBUILD ? "/intg/submissions" : undefined,
		assetPrefix: process.env.DOCKERBUILD ? "/intg/submissions/" : undefined,
		reactStrictMode: true,
		experimental: {
			instrumentationHook: true,
		},
	}
);

export default withSentryConfig(nextConfig, {
	// For all available options, see:
	// https://github.com/getsentry/sentry-webpack-plugin#options

	// Suppresses source map uploading logs during build
	silent: true,
	org: "kfg",
	project: "v7-submissions",
	// },
	// {
	// For all available options, see:
	// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

	// Upload a larger set of source maps for prettier stack traces (increases build time)
	widenClientFileUpload: true,

	// Transpiles SDK to be compatible with IE11 (increases bundle size)
	// transpileClientSDK: true,

	// Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
	// tunnelRoute: "/monitoring",

	// Hides source maps from generated client bundles
	hideSourceMaps: true,

	// Automatically tree-shake Sentry logger statements to reduce bundle size
	disableLogger: true,
});
