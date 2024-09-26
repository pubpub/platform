// @ts-check

import withPreconstruct from "@preconstruct/next";
import { withSentryConfig } from "@sentry/nextjs";

import "./lib/env/env.mjs";

/**
 * @type {import("next").NextConfig}
 */
const nextConfig = {
	eslint: {
		ignoreDuringBuilds: true,
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	reactStrictMode: true,
	/**
	 * This is necessary to get around Next.js hard 2MB limit
	 * for cached fetches.
	 */
	cacheHandler: new URL("./cache-handler.mjs", import.meta.url).pathname,
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "avatars.githubusercontent.com",
				port: "",
				pathname: "/u/**",
			},
			{
				protocol: "https",
				hostname: "cloudflare-ipfs.com",
				port: "",
				pathname: "/ipfs/**",
			},
		],
	},
	experimental: {
		instrumentationHook: true,
		webpackBuildWorker: true,
		serverComponentsExternalPackages: [
			"@aws-sdk",
			// without this here, next will sort of implode and no longer compile and serve pages properly
			// if graphile-worker is used in server actions
			"graphile-worker",
			"@node-rs/argon2",
		],
	},
	// open telemetry cries a lot during build, don't think it's serious
	// https://github.com/open-telemetry/opentelemetry-js/issues/4173
	webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
		if (isServer) {
			config.ignoreWarnings = [{ module: /opentelemetry/ }];
		}

		// this decreases (somethow) the amount of memory used by wepbpack
		// https://nextjs.org/docs/app/building-your-application/optimizing/memory-usage#disable-webpack-cache
		if (config.cache && !dev) {
			config.cache = Object.freeze({
				type: "memory",
			});
		}

		return config;
	},
};

const modifiedConfig = withPreconstruct(
	withSentryConfig(nextConfig, {
		// For all available options, see:
		// https://github.com/getsentry/sentry-webpack-plugin#options

		// Suppresses source map uploading logs during build
		silent: true,
		org: "kfg",
		project: "v7-core",
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
	})
);

export default modifiedConfig;
