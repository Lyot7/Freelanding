import { projects } from '$lib/data/projects';

export const GET = async () => {
    const pages = [
        '',
        'rendez-vous',
        'mentions-legales',
        'cgv'
    ];

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${pages
        .map(
            (page) => `
    <url>
        <loc>https://eliottbouquerel.fr/${page}</loc>
        <changefreq>monthly</changefreq>
        <priority>${page === '' ? '1.0' : '0.8'}</priority>
    </url>`
        )
        .join('')}
    ${projects
        .map(
            (project) => `
    <url>
        <loc>https://eliottbouquerel.fr/projets/${project.slug}</loc>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>`
        )
        .join('')}
</urlset>`;

    return new Response(body, {
        headers: {
            'Cache-Control': 'max-age=0, s-maxage=3600',
            'Content-Type': 'application/xml'
        }
    });
};
