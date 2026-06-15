import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import {
	personJsonLd,
	websiteJsonLd,
	professionalServiceJsonLd,
	jsonLdScript
} from '@/lib/seo/jsonld';

const SITE_URL = 'https://eliottbouquerel.fr';

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: {
		default:
			'Eliott B. - Automatisation Web & IA | Freelance Développeur & Manager de Projet',
		template: '%s | Eliott Bouquerel'
	},
	description:
		'Automatisez ce qui ralentit, accélérez ce qui rapporte. Solutions web et IA sur mesure pour PME et startups. Architecture moderne, agents autonomes, audit de productivité.',
	keywords: [
		'Freelance Web',
		'Automatisation IA',
		'Agents Autonomes',
		'SvelteKit',
		'Next.js',
		'Architecture Web',
		'N8N',
		'Productivité',
		'PME',
		'Startup'
	],
	authors: [{ name: 'Eliott Bouquerel' }],
	alternates: { canonical: SITE_URL },
	verification: { google: 'lI44_vWAs-q4NczgsNZEDJZivuf9wYm3dLzHdepJBSA' },
	manifest: '/favicon/site.webmanifest',
	icons: {
		icon: [
			{ url: '/favicon/favicon.svg', type: 'image/svg+xml' },
			{ url: '/favicon/favicon-96x96.png', sizes: '96x96', type: 'image/png' }
		],
		shortcut: '/favicon/favicon.ico',
		apple: '/favicon/apple-touch-icon.png'
	},
	openGraph: {
		type: 'website',
		url: SITE_URL,
		title: 'Eliott B. - Automatisation Web & IA | Freelance',
		description:
			'Vos équipes perdent des heures sur des tâches répétitives. Je crée des solutions web et IA qui les font à leur place, plus vite et sans erreur.',
		images: [{ url: '/og-image.jpg' }],
		locale: 'fr_FR'
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Eliott B. - Automatisation Web & IA | Freelance',
		description:
			'Vos équipes perdent des heures sur des tâches répétitives. Je crée des solutions web et IA qui les font à leur place, plus vite et sans erreur.',
		images: ['/og-image.jpg']
	}
};

export const viewport: Viewport = {
	themeColor: '#0F1A18',
	width: 'device-width',
	initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="fr">
			<head>
				<link rel="dns-prefetch" href="https://cdn.simpleicons.org" />
				<link rel="preconnect" href="https://cdn.simpleicons.org" crossOrigin="anonymous" />
				<link
					rel="preload"
					href="/fonts/instrument-sans/instrument-sans-variable.woff2"
					as="font"
					type="font/woff2"
					crossOrigin="anonymous"
				/>
				<link
					rel="preload"
					href="/fonts/playfair-display/playfair-display-variable.woff2"
					as="font"
					type="font/woff2"
					crossOrigin="anonymous"
				/>
			</head>
			<body>
				<script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(personJsonLd)} />
				<script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(websiteJsonLd)} />
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={jsonLdScript(professionalServiceJsonLd)}
				/>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
