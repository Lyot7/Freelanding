import type { MetadataRoute } from 'next';
import { projects } from '@/lib/data/projects';

const SITE_URL = 'https://eliottbouquerel.fr';

export default function sitemap(): MetadataRoute.Sitemap {
	const now = new Date();

	const staticPages: MetadataRoute.Sitemap = [
		{ url: `${SITE_URL}`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
		{ url: `${SITE_URL}/rendez-vous`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
		{
			url: `${SITE_URL}/mentions-legales`,
			lastModified: now,
			changeFrequency: 'yearly',
			priority: 0.3
		},
		{ url: `${SITE_URL}/cgv`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 }
	];

	const projectPages: MetadataRoute.Sitemap = projects.map((p) => ({
		url: `${SITE_URL}/projets/${p.slug}`,
		lastModified: now,
		changeFrequency: 'monthly',
		priority: 0.7
	}));

	return [
		...staticPages,
		...projectPages,
		{ url: `${SITE_URL}/llms.txt`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 }
	];
}
