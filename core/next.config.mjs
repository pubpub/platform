// @ts-check

import { PHASE_PRODUCTION_BUILD } from "next/dist/shared/lib/constants.js";
import withPreconstruct from "@preconstruct/next";
import { withSentryConfig } from "@sentry/nextjs";

import { env } from "./lib/env/env.mjs";

// import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

/**
 * @type {import("next").NextConfig}
 */
const nextConfig = {
	output: "standalone",
	typescript: {
		// this gets checked in CI already
		ignoreBuildErrors: true,
	},
	eslint: {
		// this gets checked in CI already
		ignoreDuringBuilds: true,
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
	serverExternalPackages: [
		"@aws-sdk",
		// without this here, next will sort of implode and no longer compile and serve pages properly
		// if graphile-worker is used in server actions
		"graphile-worker",
		"@node-rs/argon2",
	],
	experimental: {
		optimizePackageImports: ["@icons-pack/react-simple-icons", "lucide-react"],
	},
	// open telemetry cries a lot during build, don't think it's serious
	// https://github.com/open-telemetry/opentelemetry-js/issues/4173
	// webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
	// 	if (isServer) {
	// 		config.ignoreWarnings = [{ module: /opentelemetry/ }];
	// 	}
	// 	return config;
	// },
};

const modifiedConfig = withPreconstruct(
	withSentryConfig(nextConfig, {
		// For all available options, see:
		// https://github.com/getsentry/sentry-webpack-plugin#options

		// Suppresses source map uploading logs during build
		silent: true,
		org: "kfg",
		project: "v7-core",
		authToken: env.SENTRY_AUTH_TOKEN,
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
		sourcemaps: {
			// necessary to prevent OOM errors
			deleteSourcemapsAfterUpload: true,
		},
	})
);

export default (phase, { defaultConfig }) => {
	if (!env.SENTRY_AUTH_TOKEN) {
		console.warn("⚠️ SENTRY_AUTH_TOKEN is not set");
	}

	if (phase === PHASE_PRODUCTION_BUILD && env.CI) {
		if (!env.SENTRY_AUTH_TOKEN) {
			throw new Error(
				"SENTRY_AUTH_TOKEN is required for production builds in CI in order to upload source maps to sentry"
			);
		}
		console.log("✅ SENTRY_AUTH_TOKEN is successfully set");
	}
	return modifiedConfig;
};
