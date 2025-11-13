import type { NextConfig } from "next";

import nextra from "nextra";

import { path } from "./utils/path";

const withNextra = nextra({
	search: true,
	mdxOptions: {
		rehypePrettyCodeOptions: {
			//
		},
	},
});

const nextConfig: NextConfig = withNextra({
	output: "export",
	basePath: path(""),
	typescript: {
		ignoreBuildErrors: true,
	},
	experimental: {
		parallelServerBuildTraces: true,
		webpackBuildWorker: true,
	},
});

export default nextConfig;
