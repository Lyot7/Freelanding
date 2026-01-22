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

	<!-- Structured Data (JSON-LD) -->
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "ProfessionalService",
			"name": "Eliott Bouquerel - Freelance Web & IA",
			"image": "https://eliottbouquerel.fr/my-pic.png",
			"url": "https://eliottbouquerel.fr",
			"telephone": "",
			"address": {
				"@type": "PostalAddress",
				"addressLocality": "France",
				"addressCountry": "FR"
			},
			"geo": {
				"@type": "GeoCoordinates",
				"latitude": 48.8566,
				"longitude": 2.3522
			},
			"openingHoursSpecification": {
				"@type": "OpeningHoursSpecification",
				"dayOfWeek": [
					"Monday",
					"Tuesday",
					"Wednesday",
					"Thursday",
					"Friday"
				],
				"opens": "09:00",
				"closes": "18:00"
			},
			"sameAs": [
				"https://github.com/Eliott-B"
			]
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
