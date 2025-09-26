// /my-monorepo/client/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
	swcMinify: true, // Use SWC for faster compilation
	watchOptions: {
		ignored: [
			"../contracts/**", // Ignore Solidity files and artifacts
			"../readme.md", // Ignore root readme
		],
	},
};
module.exports = nextConfig;
