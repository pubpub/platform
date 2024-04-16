// @ts-check

import withPreconstruct from "@preconstruct/next";
import { withSentryConfig } from "@sentry/nextjs";
import { makeEnvPublic } from "next-runtime-env";

import "./lib/env/env.mjs";

// import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

makeEnvPublic("PUBPUB_URL");
makeEnvPublic("SUPABASE_PUBLIC_KEY");
makeEnvPublic("SUPABASE_URL");

/**
 * @type {import("next").NextConfig}
 */
const nextConfig = {
	eslint: {
		ignoreDuringBuilds: true,
	},
	reactStrictMode: true,
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
		serverComponentsExternalPackages: ["@aws-sdk"],
	},
	// open telemetry cries a lot during build, don't think it's serious
	// https://github.com/open-telemetry/opentelemetry-js/issues/4173
	webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
		if (isServer) {
			config.ignoreWarnings = [{ module: /opentelemetry/ }];
		}
		return config;
	},
};

const modifiedConfig = withPreconstruct(
	withSentryConfig(
		nextConfig,
		{
			// For all available options, see:
			// https://github.com/getsentry/sentry-webpack-plugin#options

			// Suppresses source map uploading logs during build
			silent: true,
			org: "kfg",
			project: "v7-core",
		},
		{
			// For all available options, see:
			// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

			// Upload a larger set of source maps for prettier stack traces (increases build time)
			widenClientFileUpload: true,

			// Transpiles SDK to be compatible with IE11 (increases bundle size)
			transpileClientSDK: true,

			// Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
			// tunnelRoute: "/monitoring",

			// Hides source maps from generated client bundles
			hideSourceMaps: true,

			// Automatically tree-shake Sentry logger statements to reduce bundle size
			disableLogger: true,
		}
	)
);

export default (phase, { defaultConfig }) => {
	if (phase !== "phase-development-server") {
		return modifiedConfig;
	}

	return {
		...modifiedConfig,
		experimental: {
			...modifiedConfig.experimental,
			serverComponentsExternalPackages: [
				...(modifiedConfig.experimental?.serverComponentsExternalPackages ?? []),
				// we need this to be external (for now) during dev, but not during build
				// https://github.com/expatfile/next-runtime-env/issues/123
				"next-runtime-env",
			],
		},
	};
};
