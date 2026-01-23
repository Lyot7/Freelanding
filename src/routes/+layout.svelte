<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { tick } from 'svelte';
	import '../app.css';
    import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import ClickSpark from '$lib/components/ClickSpark.svelte';

	let { children } = $props();

	afterNavigate(async () => {
		await tick();
		window.scrollTo({ top: 0, behavior: 'instant' });
	});
</script>

<svelte:head>
	<!-- Preload critical local fonts for optimal performance -->
	<link rel="preload" href="/fonts/instrument-sans/instrument-sans-variable.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
	<link rel="preload" href="/fonts/playfair-display/playfair-display-variable.woff2" as="font" type="font/woff2" crossorigin="anonymous" />

	<!-- Structured Data: Person (JSON-LD) -->
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "Person",
			"name": "Eliott Bouquerel",
			"jobTitle": "Developpeur & Manager de Projet Web Freelance",
			"url": "https://eliottbouquerel.fr",
			"image": "https://eliottbouquerel.fr/my-pic.png",
			"description": "Automatisez ce qui ralentit, accelerez ce qui rapporte. Solutions web et IA sur mesure pour PME et startups. Architecture moderne, agents autonomes, audit de productivite.",
			"address": {
				"@type": "PostalAddress",
				"addressLocality": "Caen",
				"addressRegion": "Normandie",
				"addressCountry": "FR"
			},
			"alumniOf": [
				{
					"@type": "EducationalOrganization",
					"name": "Master Developpeur & Manager de Projet Web"
				},
				{
					"@type": "EducationalOrganization",
					"name": "Bachelor Metiers du Multimedia et d'Internet"
				}
			],
			"knowsAbout": [
				"Architecture Web",
				"SvelteKit",
				"Next.js",
				"React",
				"TypeScript",
				"TailwindCSS",
				"PostgreSQL",
				"Docker",
				"Intelligence Artificielle",
				"Automatisation",
				"N8N",
				"E-commerce"
			],
			"sameAs": [
				"https://github.com/Eliott-B"
			]
		}
	</script>

	<!-- Structured Data: WebSite (JSON-LD) -->
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "WebSite",
			"name": "Eliott Bouquerel - Automatisation Web & IA",
			"url": "https://eliottbouquerel.fr",
			"description": "Automatisez ce qui ralentit, accelerez ce qui rapporte. Solutions web et IA sur mesure pour PME et startups.",
			"inLanguage": "fr",
			"author": {
				"@type": "Person",
				"name": "Eliott Bouquerel"
			}
		}
	</script>

	<!-- Structured Data: ProfessionalService (JSON-LD) -->
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "ProfessionalService",
			"name": "Eliott Bouquerel - Automatisation Web & IA",
			"image": "https://eliottbouquerel.fr/my-pic.png",
			"url": "https://eliottbouquerel.fr",
			"address": {
				"@type": "PostalAddress",
				"addressLocality": "Caen",
				"addressRegion": "Normandie",
				"addressCountry": "FR"
			},
			"geo": {
				"@type": "GeoCoordinates",
				"latitude": 49.1829,
				"longitude": -0.3707
			},
			"openingHoursSpecification": {
				"@type": "OpeningHoursSpecification",
				"dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
				"opens": "09:00",
				"closes": "18:00"
			},
			"hasOfferCatalog": {
				"@type": "OfferCatalog",
				"name": "Services Freelance Web & IA",
				"itemListElement": [
					{
						"@type": "Offer",
						"itemOffered": {
							"@type": "Service",
							"name": "Architecture & Refonte Web",
							"description": "Modernisation d'infrastructures web legacy vers des architectures modernes, performantes et scalables. Migration vers des architectures headless."
						}
					},
					{
						"@type": "Offer",
						"itemOffered": {
							"@type": "Service",
							"name": "Integration IA & Agents Autonomes",
							"description": "Deploiement d'agents IA personnalises pour automatiser les taches repetitives : support client, analyse, redaction. Utilisation de N8N, Claude, Gemini."
						}
					},
					{
						"@type": "Offer",
						"itemOffered": {
							"@type": "Service",
							"name": "Audit de Productivite",
							"description": "Analyse approfondie des processus metier pour identifier les opportunites d'automatisation. Livraison d'une roadmap ROI chiffree."
						}
					}
				]
			},
			"sameAs": ["https://github.com/Eliott-B"]
		}
	</script>
</svelte:head>

<ClickSpark />
<Navbar />

<div class="relative min-h-screen">
    <!-- Noise Texture Overlay -->
    <div class="noise-bg"></div>
    
    <main>
        {@render children()}
    </main>

    <Footer />
</div>
