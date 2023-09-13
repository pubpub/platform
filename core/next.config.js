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
		],
	},
};

module.exports = withPreconstruct(nextConfig);
