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
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<!-- Preload critical fonts to reduce CLS -->
	<link
		rel="preload"
		href="https://fonts.gstatic.com/s/playfairdisplay/v40/nuFiD-vYSZviVYUb_rj3ij__anPXDTzYgEM86xQ.woff2"
		as="font"
		type="font/woff2"
		crossorigin="anonymous"
	/>
	<link
		rel="preload"
		href="https://fonts.gstatic.com/s/instrumentsans/v4/pxiTypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr0SZe1ZuWi3g.woff2"
		as="font"
		type="font/woff2"
		crossorigin="anonymous"
	/>
	<!-- Preload Material Symbols to reduce CLS -->
	<link
		rel="preload"
		href="https://fonts.gstatic.com/s/materialsymbolsoutlined/v236/kJF1BvYX7BgnkSrUwT8OhrdQw4oELdPIeeII9v6oDMzByHX9rA6RzaxHMPdY43zj-jCxv3fzvRNU22ZXGJpEpjC_1v-p_4MrImHCIJIZrDCvHeembd5zrTgt.woff2"
		as="font"
		type="font/woff2"
		crossorigin="anonymous"
	/>
	<!-- Non-render-blocking font loading with fetchpriority="low" -->
	<link
		href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Instrument+Sans:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
	<link
		href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
		rel="stylesheet"
	/>

	<!-- Structured Data (JSON-LD) -->
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "ProfessionalService",
			"name": "Eliott Bouquerel - Freelance Web & IA",
			"image": "https://eliott-bouquerel.fr/my-pic.png",
			"url": "https://eliott-bouquerel.fr",
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
