import type { NextConfig } from 'next';

const ONE_YEAR = 'public, max-age=31536000, immutable';

const nextConfig: NextConfig = {
	// Produces .next/standalone for a small Docker image
	output: 'standalone',

	reactStrictMode: true,

	images: {
		formats: ['image/avif', 'image/webp'],
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'cdn.simpleicons.org'
			}
		]
	},

	// Three.js / R3F transpilation safety
	transpilePackages: ['three'],

	async headers() {
		return [
			{
				// Immutable cache for versioned static assets (was hooks.server.ts)
				source: '/:dir(fonts|avatars|diagrams|favicon)/:path*',
				headers: [{ key: 'Cache-Control', value: ONE_YEAR }]
			},
			{
				source: '/logo.svg',
				headers: [{ key: 'Cache-Control', value: ONE_YEAR }]
			}
		];
	}
};

export default nextConfig;
