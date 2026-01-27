import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	const path = event.url.pathname;

	// Cache immutable (1 an) pour assets statiques versionnés
	if (
		path.startsWith('/fonts/') ||
		path.startsWith('/avatars/') ||
		path.startsWith('/diagrams/') ||
		path.startsWith('/favicon/') ||
		path === '/logo.svg' ||
		path.includes('/_app/immutable/')
	) {
		response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
	}

	return response;
};
