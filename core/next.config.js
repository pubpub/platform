/** @type {import('next').NextConfig} */
const withPreconstruct = require("@preconstruct/next");

const nextConfig = {
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
		serverActions: true,
	},
};

module.exports = withPreconstruct(nextConfig);
