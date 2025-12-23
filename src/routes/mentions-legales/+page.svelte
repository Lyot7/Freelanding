<script lang="ts">
	import { onMount } from 'svelte';

	// Navbar scroll effect
	let navScrolled = $state(false);

	onMount(() => {
		const handleScroll = () => {
			navScrolled = window.scrollY > 50;
		};
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	});
</script>

<svelte:head>
	<title>Mentions Légales - Eliott B.</title>
	<meta
		name="description"
		content="Mentions légales du site d'Eliott Bouquerel, développeur freelance spécialisé en intégration IA."
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

<div class="relative overflow-x-hidden">
	<!-- Noise Texture Overlay -->
	<div class="noise-bg"></div>

	<!-- Navigation -->
	<nav
		id="navbar"
		class="fixed w-full z-40 transition-all duration-300 px-6 md:px-12"
		class:pt-8={!navScrolled}
		class:py-4={navScrolled}
	>
		<div
			class="max-w-7xl mx-auto flex justify-between items-center bg-aura-bg/80 backdrop-blur-md rounded-full px-6 py-3 border border-aura-surface/50"
		>
			<a
				href="/"
				class="text-xl font-serif font-semibold tracking-tight text-white flex items-center gap-3"
			>
				<img src="/logo.png" alt="Eliott B." class="w-8 h-8 object-contain" />
				Eliott B.
			</a>

			<div class="hidden md:flex items-center space-x-8 text-sm font-medium text-aura-muted">
				<a href="/#expertise" class="hover:text-white transition-colors">Expertise</a>
				<a href="/#simulator" class="hover:text-white transition-colors">Calculateur ROI</a>
				<a href="/#projects" class="hover:text-white transition-colors">Projets</a>
			</div>

			<a
				href="https://calendly.com"
				target="_blank"
				rel="noopener noreferrer"
				class="bg-aura-accent text-aura-bg px-6 py-2 rounded-full font-semibold text-sm hover:bg-white transition-colors"
			>
				Prendre RDV
			</a>
		</div>
	</nav>

	<!-- Main Content -->
	<main class="pt-32 pb-24 min-h-screen px-6">
		<div class="max-w-4xl mx-auto">
			<h1 class="text-4xl md:text-5xl font-serif mb-8">Mentions Légales</h1>
			<div class="w-24 h-1 bg-aura-accent mb-12 rounded-full opacity-50"></div>

			<div class="space-y-8 text-aura-muted leading-relaxed">
				<section>
					<h2 class="text-2xl font-serif text-white mb-4">1. Éditeur du site</h2>
					<p>
						Le site <strong class="text-white">freelanding-v2</strong> est édité par :
					</p>
					<div class="mt-4 pl-4 border-l-2 border-aura-surface">
						<p class="text-white font-medium">Eliott Bouquerel</p>
						<p>Développeur freelance</p>
						<p>Expert en transition IA</p>
					</div>
				</section>

				<section>
					<h2 class="text-2xl font-serif text-white mb-4">2. Hébergement</h2>
					<p>
						Le site est hébergé par un prestataire externe. Pour toute question concernant
						l'hébergement, veuillez nous contacter.
					</p>
				</section>

				<section>
					<h2 class="text-2xl font-serif text-white mb-4">3. Propriété intellectuelle</h2>
					<p>
						L'ensemble du contenu de ce site (textes, images, logos, graphismes) est la propriété
						exclusive d'Eliott Bouquerel, sauf mention contraire. Toute reproduction, même
						partielle, est interdite sans autorisation préalable.
					</p>
				</section>

				<section>
					<h2 class="text-2xl font-serif text-white mb-4">4. Protection des données personnelles</h2>
					<p>
						Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez
						d'un droit d'accès, de rectification, de suppression et d'opposition aux données vous
						concernant. Pour exercer ces droits, contactez-nous à l'adresse email indiquée sur le
						site.
					</p>
				</section>

				<section>
					<h2 class="text-2xl font-serif text-white mb-4">5. Cookies</h2>
					<p>
						Ce site utilise des cookies pour améliorer l'expérience utilisateur. En continuant à
						naviguer sur ce site, vous acceptez l'utilisation de cookies.
					</p>
				</section>

				<section>
					<h2 class="text-2xl font-serif text-white mb-4">6. Responsabilité</h2>
					<p>
						Eliott Bouquerel ne pourra être tenu responsable des dommages directs ou indirects
						causés au matériel de l'utilisateur lors de l'accès au site, et résultant soit de
						l'utilisation d'un matériel ne répondant pas aux spécifications, soit de l'apparition
						d'un bug ou d'une incompatibilité.
					</p>
				</section>

				<section>
					<h2 class="text-2xl font-serif text-white mb-4">7. Contact</h2>
					<p>
						Pour toute question concernant ces mentions légales, vous pouvez nous contacter par
						email à l'adresse indiquée sur le site.
					</p>
				</section>
			</div>

			<div class="mt-16 pt-8 border-t border-aura-surface">
				<a
					href="/"
					class="inline-flex items-center gap-2 text-aura-accent hover:text-white transition-colors"
				>
					<span class="material-symbols-outlined text-sm">arrow_back</span>
					Retour à l'accueil
				</a>
			</div>
		</div>
	</main>
</div>

