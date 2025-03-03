import type { NextConfig } from "next";

import nextra from "nextra";

const withNextra = nextra({
	search: true,
	mdxOptions: {
		rehypePrettyCodeOptions: {
			// theme: {
			// 	dark: "nord",
			// },
		},
	},
});

const nextConfig: NextConfig = withNextra({
	// output: "export",

	experimental: {
		// mdxRs: true,
		parallelServerBuildTraces: true,
		webpackBuildWorker: true,
	},
	/* config options here */
});

export default nextConfig;
