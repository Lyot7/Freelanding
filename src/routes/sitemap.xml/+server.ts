import { projects } from '$lib/data/projects';

export const GET = async () => {
    const lastmod = new Date().toISOString().split('T')[0];

    const pages = [
        { path: '', priority: '1.0', changefreq: 'weekly' },
        { path: 'rendez-vous', priority: '0.8', changefreq: 'monthly' },
        { path: 'mentions-legales', priority: '0.3', changefreq: 'yearly' },
        { path: 'cgv', priority: '0.3', changefreq: 'yearly' }
    ];

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${pages
        .map(
            (page) => `
    <url>
        <loc>https://eliottbouquerel.fr/${page.path}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>${page.changefreq}</changefreq>
        <priority>${page.priority}</priority>
    </url>`
        )
        .join('')}
    ${projects
        .map(
            (project) => `
    <url>
        <loc>https://eliottbouquerel.fr/projets/${project.slug}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>`
        )
        .join('')}
    <url>
        <loc>https://eliottbouquerel.fr/llms.txt</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.5</priority>
    </url>
</urlset>`;

    return new Response(body, {
        headers: {
            'Cache-Control': 'max-age=0, s-maxage=3600',
            'Content-Type': 'application/xml'
        }
    });
};
