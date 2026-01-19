import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	// Cache long pour fichiers statiques (fonts, images, avatars)
	const path = event.url.pathname;
	if (path.startsWith('/fonts/') || path.startsWith('/avatars/') || path === '/logo.svg') {
		response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
	}

	return response;
};
