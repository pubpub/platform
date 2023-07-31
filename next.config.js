/** @type {import('next').NextConfig} */
const nextConfig = {
	typescript: {
		// !! WARN !!
		// Dangerously allow production builds to successfully complete even if
		// your project has type errors.
		// !! WARN !!
		/* Remove this as soon as tr/deploy-spike is merged */
		ignoreBuildErrors: true,
	},
};

module.exports = nextConfig;
