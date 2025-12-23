<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Instrument+Sans:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
	<link
		href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
		rel="stylesheet"
	/>
	
	<!-- Favicons -->
	<link rel="icon" type="image/png" href="/logo.png" />
	<link rel="apple-touch-icon" href="/logo.png" />
	<link rel="icon" type="image/png" sizes="32x32" href="/logo.png" />
	<link rel="icon" type="image/png" sizes="16x16" href="/logo.png" />
	
	<!-- Mobile Icons -->
	<link rel="apple-touch-icon" sizes="180x180" href="/logo.png" />
	<link rel="icon" type="image/png" sizes="192x192" href="/logo.png" />
	<link rel="icon" type="image/png" sizes="512x512" href="/logo.png" />
	
	<!-- Theme Color -->
	<meta name="theme-color" content="#0F1A18" />
	<meta name="msapplication-TileColor" content="#0F1A18" />
	<meta name="msapplication-TileImage" content="/logo.png" />
</svelte:head>

{@render children()}
