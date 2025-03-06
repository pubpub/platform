import type { NextConfig } from "next";

import nextra from "nextra";

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
	basePath: `/platform${process.env.PR_NUMBER ? `/pr-preview/pr-${process.env.PR_NUMBER}` : ""}`,
	typescript: {
		ignoreBuildErrors: true,
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
	experimental: {
		parallelServerBuildTraces: true,
		webpackBuildWorker: true,
	},
});

export default nextConfig;
