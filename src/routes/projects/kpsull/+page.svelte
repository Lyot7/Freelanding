<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import SectionTitle from '$lib/components/SectionTitle.svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { footerConfig } from '$lib/stores/footer';

	// Image optimisée
	import mockupKpsull from '$lib/assets/images/mockup-kpsull.png?enhanced';

	let loaded = $state(false);

	onMount(() => {
		setTimeout(() => {
			loaded = true;
		}, 600);

		// Configure footer for this page
		footerConfig.configure({
			title: 'Votre aventure entrepreneuriale',
			titleAccent: 'ici',
			description:
				"De l'idée au MVP, je transforme vos concepts en produits digitaux concrets. Discutons de votre vision.",
			primaryButton: {
				label: 'Prendre rendez-vous',
				href: '/rendez-vous',
				icon: 'calendar_today'
			},
			secondaryButton: {
				label: "Voir d'autres projets",
				href: '/#projects',
				icon: 'arrow_forward'
			}
		});
	});

	onDestroy(() => {
		footerConfig.reset();
	});
</script>

<svelte:head>
	<title>KPSULL - Marketplace Mode & Créateurs | Eliott B.</title>
	<meta
		name="description"
		content="KPSULL : marketplace pour créateurs de mode indépendants. +50% de temps créatif récupéré, x3 taux de conversion, mise en ligne en moins de 5 minutes."
	/>
	<meta property="og:title" content="KPSULL - Marketplace Mode & Créateurs" />
	<meta
		property="og:description"
		content="Les créateurs perdent 50% de leur temps à vendre. KPSULL centralise vitrine, paiements et gestion pour qu'ils se concentrent sur leur métier."
	/>
	<meta property="og:image" content="/mockup-kpsull.png" />
	<meta property="og:type" content="article" />
	<meta name="twitter:card" content="summary_large_image" />
	<link rel="canonical" href="https://eliottb.dev/projects/kpsull" />
</svelte:head>

<!-- Hero Section -->
<header class="relative min-h-[70vh] pt-24 pb-16 md:pt-32 md:pb-24 flex flex-col justify-center px-6">
	<!-- Background Glows -->
	<div
		class="absolute top-0 right-0 w-[500px] h-[500px] bg-aura-accent/5 rounded-full blur-[120px] pointer-events-none"
	></div>
	<div
		class="absolute bottom-0 left-0 w-[300px] h-[300px] bg-aura-gold/5 rounded-full blur-[100px] pointer-events-none"
	></div>

	<div class="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-16 items-center z-10">
		<!-- Content -->
		<div class="space-y-6 reveal-on-scroll" use:reveal>
			<!-- Back link -->
			<div>
				<a
					href="/#projects"
					class="inline-flex items-center gap-2 text-sm text-aura-muted hover:text-aura-accent transition-colors"
				>
					{#if !loaded}
						<Skeleton width="16px" height="16px" variant="circular" />
						<Skeleton width="100px" height="12px" />
					{:else}
						<span class="material-symbols-outlined text-[16px]">arrow_back</span>
						Retour aux projets
					{/if}
				</a>
			</div>

			<!-- Tags -->
			<div class="flex flex-wrap gap-3">
				<span
					class="px-3 py-1 rounded-full border border-aura-accent/50 text-xs text-aura-accent uppercase tracking-wider"
					>Cofondateur</span
				>
				<span
					class="px-3 py-1 rounded-full border border-aura-surface text-xs text-aura-muted uppercase tracking-wider"
					>Marketplace</span
				>
			</div>

			<h1 class="text-4xl md:text-6xl font-serif leading-[1.1]">
				<span class="text-aura-accent">KPSULL</span>
			</h1>

			<p class="text-xl md:text-2xl text-aura-muted font-light leading-relaxed">
				Les créateurs perdent 50% de leur temps à vendre. KPSULL centralise vitrine, paiements et gestion pour qu'ils se concentrent sur leur métier.
			</p>

			<!-- Key Metrics -->
			<div class="grid grid-cols-2 gap-6 pt-6 border-t border-aura-surface">
				<div>
					<span class="block text-2xl md:text-3xl font-serif text-aura-accent">+50%</span>
					<span class="text-xs text-aura-muted">Temps créatif récupéré</span>
				</div>
				<div>
					<span class="block text-2xl md:text-3xl font-serif text-white">x3</span>
					<span class="text-xs text-aura-muted">Taux de conversion</span>
				</div>
			</div>
		</div>

		<!-- Hero Image -->
		<div class="relative reveal-on-scroll" use:reveal={{ delay: 200 }}>
			<div
				class="relative rounded-3xl overflow-hidden border border-aura-surface shadow-2xl"
			>
				<enhanced:img
					src={mockupKpsull}
					alt="KPSULL Marketplace"
					class="w-full h-auto"
					fetchpriority="high"
				/>
			</div>
		</div>
	</div>
</header>

<!-- Section Le Constat -->
<section class="py-16 md:py-24 px-6">
	<div class="max-w-7xl mx-auto">
		<SectionTitle title="Le" subtitle="Constat" align="left" />

		<div class="grid lg:grid-cols-2 gap-12 lg:gap-16 mt-12">
			<!-- Texte narratif -->
			<div class="space-y-8 reveal-on-scroll" use:reveal>
				<div class="space-y-4">
					<div class="flex items-center gap-3">
						{#if !loaded}
							<Skeleton width="24px" height="24px" variant="circular" />
						{:else}
							<span class="material-symbols-outlined text-aura-accent">palette</span>
						{/if}
						<span class="text-sm text-aura-accent uppercase tracking-wider">Côté Créateur</span>
					</div>
					<p class="text-lg text-aura-text leading-relaxed italic">
						"Je passe mes week-ends à concevoir des vêtements dans mon atelier. Mes créations sont uniques… mais <span class="text-aura-accent">invisibles</span>."
					</p>
				</div>

				<div class="space-y-4">
					<div class="flex items-center gap-3">
						{#if !loaded}
							<Skeleton width="24px" height="24px" variant="circular" />
						{:else}
							<span class="material-symbols-outlined text-aura-gold">shopping_bag</span>
						{/if}
						<span class="text-sm text-aura-gold uppercase tracking-wider">Côté Acheteur</span>
					</div>
					<p class="text-lg text-aura-text leading-relaxed italic">
						"Je scrolle depuis deux heures. Je cherche une pièce qui me ressemble, pas un énième produit de <span class="text-aura-gold">fast-fashion</span>."
					</p>
				</div>

				<p class="text-2xl font-serif text-white pt-4 border-t border-aura-surface">
					On ne se connaît pas. <span class="text-aura-accent italic">On devrait.</span>
				</p>
			</div>

			<!-- Card Frustrations -->
			<div class="bg-aura-card rounded-3xl p-8 border border-aura-surface reveal-on-scroll" use:reveal={{ delay: 150 }}>
				<h3 class="text-xl font-serif mb-6">Les frustrations</h3>

				<div class="grid grid-cols-2 gap-6">
					<div class="space-y-4">
						<div class="flex items-center gap-2 text-aura-accent">
							{#if !loaded}
								<Skeleton width="20px" height="20px" variant="circular" />
							{:else}
								<span class="material-symbols-outlined text-[20px]">palette</span>
							{/if}
							<span class="text-sm font-medium">Créateurs</span>
						</div>
						<ul class="space-y-3 text-sm text-aura-muted">
							<li class="flex items-start gap-2">
								<span class="text-red-400 mt-1">×</span>
								Visibilité difficile
							</li>
							<li class="flex items-start gap-2">
								<span class="text-red-400 mt-1">×</span>
								Jongler entre canaux
							</li>
							<li class="flex items-start gap-2">
								<span class="text-red-400 mt-1">×</span>
								Efforts sans retour
							</li>
							<li class="flex items-start gap-2">
								<span class="text-red-400 mt-1">×</span>
								Audience cachée
							</li>
						</ul>
					</div>

					<div class="space-y-4">
						<div class="flex items-center gap-2 text-aura-gold">
							{#if !loaded}
								<Skeleton width="20px" height="20px" variant="circular" />
							{:else}
								<span class="material-symbols-outlined text-[20px]">shopping_bag</span>
							{/if}
							<span class="text-sm font-medium">Acheteurs</span>
						</div>
						<ul class="space-y-3 text-sm text-aura-muted">
							<li class="flex items-start gap-2">
								<span class="text-red-400 mt-1">×</span>
								Trop de plateformes
							</li>
							<li class="flex items-start gap-2">
								<span class="text-red-400 mt-1">×</span>
								Fast-fashion dominant
							</li>
							<li class="flex items-start gap-2">
								<span class="text-red-400 mt-1">×</span>
								Mauvaises surprises
							</li>
							<li class="flex items-start gap-2">
								<span class="text-red-400 mt-1">×</span>
								Manque de sens
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Section Problématique -->
<section class="py-16 md:py-24 px-6">
	<div class="max-w-4xl mx-auto">
		<div class="bg-aura-card rounded-3xl p-8 md:p-12 border border-aura-surface text-center reveal-on-scroll" use:reveal>
			<blockquote class="text-xl md:text-2xl font-serif leading-relaxed">
				"Deux frustrations. Un même vide au milieu. Comment créer le pont entre des créateurs <span class="text-aura-accent italic">talentueux mais invisibles</span> et des acheteurs <span class="text-aura-gold italic">en quête d'authenticité</span> ?"
			</blockquote>
		</div>
	</div>
</section>

<!-- Section La Solution -->
<section class="py-16 md:py-24 px-6">
	<div class="max-w-7xl mx-auto">
		<SectionTitle title="La Solution" subtitle="KPSULL" />

		<div class="grid md:grid-cols-2 gap-12 lg:gap-16 mt-12">
			<!-- Pour les Créateurs -->
			<div class="bg-aura-card rounded-3xl p-8 border border-aura-surface reveal-on-scroll" use:reveal>
				<div class="flex items-center gap-3 mb-6">
					<div class="w-12 h-12 rounded-full bg-aura-accent/10 flex items-center justify-center">
						{#if !loaded}
							<Skeleton width="24px" height="24px" variant="circular" />
						{:else}
							<span class="material-symbols-outlined text-aura-accent">palette</span>
						{/if}
					</div>
					<h3 class="text-xl font-serif">Pour les Créateurs</h3>
				</div>

				<ul class="space-y-4">
					<li class="flex items-start gap-3">
						<span class="text-aura-accent mt-1">
							{#if !loaded}
								<Skeleton width="16px" height="16px" variant="circular" />
							{:else}
								<span class="material-symbols-outlined text-[18px]">check_circle</span>
							{/if}
						</span>
						<span class="text-aura-muted">Une <span class="text-white">vitrine</span> qui met en valeur leur travail</span>
					</li>
					<li class="flex items-start gap-3">
						<span class="text-aura-accent mt-1">
							{#if !loaded}
								<Skeleton width="16px" height="16px" variant="circular" />
							{:else}
								<span class="material-symbols-outlined text-[18px]">check_circle</span>
							{/if}
						</span>
						<span class="text-aura-muted">Des <span class="text-white">outils</span> pour se professionnaliser</span>
					</li>
					<li class="flex items-start gap-3">
						<span class="text-aura-accent mt-1">
							{#if !loaded}
								<Skeleton width="16px" height="16px" variant="circular" />
							{:else}
								<span class="material-symbols-outlined text-[18px]">check_circle</span>
							{/if}
						</span>
						<span class="text-aura-muted">Une <span class="text-white">communauté</span> d'acheteurs qualifiés</span>
					</li>
					<li class="flex items-start gap-3">
						<span class="text-aura-accent mt-1">
							{#if !loaded}
								<Skeleton width="16px" height="16px" variant="circular" />
							{:else}
								<span class="material-symbols-outlined text-[18px]">check_circle</span>
							{/if}
						</span>
						<span class="text-aura-muted">Moins de temps à se vendre, <span class="text-white">plus à créer</span></span>
					</li>
				</ul>
			</div>

			<!-- Pour les Acheteurs -->
			<div class="bg-aura-card rounded-3xl p-8 border border-aura-surface reveal-on-scroll" use:reveal={{ delay: 150 }}>
				<div class="flex items-center gap-3 mb-6">
					<div class="w-12 h-12 rounded-full bg-aura-gold/10 flex items-center justify-center">
						{#if !loaded}
							<Skeleton width="24px" height="24px" variant="circular" />
						{:else}
							<span class="material-symbols-outlined text-aura-gold">shopping_bag</span>
						{/if}
					</div>
					<h3 class="text-xl font-serif">Pour les Acheteurs</h3>
				</div>

				<ul class="space-y-4">
					<li class="flex items-start gap-3">
						<span class="text-aura-gold mt-1">
							{#if !loaded}
								<Skeleton width="16px" height="16px" variant="circular" />
							{:else}
								<span class="material-symbols-outlined text-[18px]">check_circle</span>
							{/if}
						</span>
						<span class="text-aura-muted">Découvrir des pièces <span class="text-white">authentiques</span></span>
					</li>
					<li class="flex items-start gap-3">
						<span class="text-aura-gold mt-1">
							{#if !loaded}
								<Skeleton width="16px" height="16px" variant="circular" />
							{:else}
								<span class="material-symbols-outlined text-[18px]">check_circle</span>
							{/if}
						</span>
						<span class="text-aura-muted">Savoir <span class="text-white">qui les a créées</span></span>
					</li>
					<li class="flex items-start gap-3">
						<span class="text-aura-gold mt-1">
							{#if !loaded}
								<Skeleton width="16px" height="16px" variant="circular" />
							{:else}
								<span class="material-symbols-outlined text-[18px]">check_circle</span>
							{/if}
						</span>
						<span class="text-aura-muted">Acheter en <span class="text-white">confiance</span></span>
					</li>
					<li class="flex items-start gap-3">
						<span class="text-aura-gold mt-1">
							{#if !loaded}
								<Skeleton width="16px" height="16px" variant="circular" />
							{:else}
								<span class="material-symbols-outlined text-[18px]">check_circle</span>
							{/if}
						</span>
						<span class="text-aura-muted">Soutenir <span class="text-white">directement</span> un savoir-faire</span>
					</li>
				</ul>
			</div>
		</div>
	</div>
</section>

<!-- Section Business Model -->
<section class="py-16 md:py-24 px-6 bg-aura-card">
	<div class="max-w-7xl mx-auto">
		<SectionTitle title="Business" subtitle="Model" />

		<div class="grid lg:grid-cols-2 gap-12 lg:gap-16 mt-12">
			<!-- Freemium -->
			<div class="space-y-6 reveal-on-scroll" use:reveal>
				<div class="flex items-center gap-3">
					<div class="w-12 h-12 rounded-full bg-aura-accent/10 flex items-center justify-center">
						{#if !loaded}
							<Skeleton width="24px" height="24px" variant="circular" />
						{:else}
							<span class="material-symbols-outlined text-aura-accent">card_giftcard</span>
						{/if}
					</div>
					<h3 class="text-xl font-serif">Modèle Freemium</h3>
				</div>

				<p class="text-aura-muted leading-relaxed">
					Les créateurs démarrent <span class="text-white">gratuitement</span> sur KPSULL. Ils peuvent tester la plateforme sans engagement, publier leurs premières créations et réaliser leurs premières ventes.
				</p>

				<div class="bg-aura-bg/50 rounded-2xl p-6 border border-aura-surface">
					<h4 class="text-sm text-aura-accent uppercase tracking-wider mb-4">Seuils de passage Premium</h4>
					<div class="grid grid-cols-2 gap-4">
						<div class="text-center p-4 bg-aura-surface/30 rounded-xl">
							<span class="block text-2xl font-serif text-white mb-1">5</span>
							<span class="text-xs text-aura-muted">articles publiés</span>
						</div>
						<div class="text-center p-4 bg-aura-surface/30 rounded-xl">
							<span class="block text-2xl font-serif text-white mb-1">10</span>
							<span class="text-xs text-aura-muted">ventes totales</span>
						</div>
					</div>
					<p class="text-xs text-aura-muted mt-4 text-center italic">
						Au-delà de ces seuils, passage aux plans supérieurs
					</p>
				</div>
			</div>

			<!-- Options Boost -->
			<div class="space-y-6 reveal-on-scroll" use:reveal={{ delay: 150 }}>
				<div class="flex items-center gap-3">
					<div class="w-12 h-12 rounded-full bg-aura-gold/10 flex items-center justify-center">
						{#if !loaded}
							<Skeleton width="24px" height="24px" variant="circular" />
						{:else}
							<span class="material-symbols-outlined text-aura-gold">rocket_launch</span>
						{/if}
					</div>
					<h3 class="text-xl font-serif">Options de Visibilité</h3>
				</div>

				<p class="text-aura-muted leading-relaxed">
					En plus des abonnements, les créateurs peuvent <span class="text-white">booster ponctuellement</span> leur visibilité pour maximiser leurs chances de vente.
				</p>

				<div class="space-y-4">
					<div class="flex items-start gap-4 p-4 bg-aura-bg/50 rounded-xl border border-aura-surface">
						<div class="w-10 h-10 rounded-lg bg-aura-gold/10 flex items-center justify-center shrink-0">
							{#if !loaded}
								<Skeleton width="20px" height="20px" variant="circular" />
							{:else}
								<span class="material-symbols-outlined text-aura-gold text-[20px]">campaign</span>
							{/if}
						</div>
						<div>
							<h4 class="font-medium text-white">Boost Annonce</h4>
							<p class="text-sm text-aura-muted">Mettre en avant un article spécifique pendant une durée choisie</p>
						</div>
					</div>

					<div class="flex items-start gap-4 p-4 bg-aura-bg/50 rounded-xl border border-aura-surface">
						<div class="w-10 h-10 rounded-lg bg-aura-gold/10 flex items-center justify-center shrink-0">
							{#if !loaded}
								<Skeleton width="20px" height="20px" variant="circular" />
							{:else}
								<span class="material-symbols-outlined text-aura-gold text-[20px]">storefront</span>
							{/if}
						</div>
						<div>
							<h4 class="font-medium text-white">Boost Vitrine</h4>
							<p class="text-sm text-aura-muted">Augmenter la visibilité de toute sa boutique pendant une période donnée</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Section Fonctionnalités Clés -->
<section class="py-16 md:py-24 px-6 bg-[#121E1C]">
	<div class="max-w-7xl mx-auto">
		<SectionTitle title="Fonctionnalités" subtitle="Clés" />

		<div class="grid md:grid-cols-3 gap-8 mt-12">
			<!-- Vitrine Créateur -->
			<div class="bg-aura-card rounded-3xl p-8 border border-aura-surface reveal-on-scroll" use:reveal>
				<div class="w-14 h-14 rounded-2xl bg-aura-accent/10 flex items-center justify-center mb-6">
					{#if !loaded}
						<Skeleton width="28px" height="28px" variant="circular" />
					{:else}
						<span class="material-symbols-outlined text-aura-accent text-[28px]">storefront</span>
					{/if}
				</div>
				<h3 class="text-xl font-serif mb-4">Vitrine Créateur</h3>
				<ul class="space-y-2 text-sm text-aura-muted">
					<li class="flex items-center gap-2">
						<span class="w-1.5 h-1.5 rounded-full bg-aura-accent"></span>
						Profil personnalisé
					</li>
					<li class="flex items-center gap-2">
						<span class="w-1.5 h-1.5 rounded-full bg-aura-accent"></span>
						Portfolio de créations
					</li>
					<li class="flex items-center gap-2">
						<span class="w-1.5 h-1.5 rounded-full bg-aura-accent"></span>
						Certification visible
					</li>
				</ul>
			</div>

			<!-- Gestion Simplifiée -->
			<div class="bg-aura-card rounded-3xl p-8 border border-aura-surface reveal-on-scroll" use:reveal={{ delay: 100 }}>
				<div class="w-14 h-14 rounded-2xl bg-aura-gold/10 flex items-center justify-center mb-6">
					{#if !loaded}
						<Skeleton width="28px" height="28px" variant="circular" />
					{:else}
						<span class="material-symbols-outlined text-aura-gold text-[28px]">inventory_2</span>
					{/if}
				</div>
				<h3 class="text-xl font-serif mb-4">Gestion Simplifiée</h3>
				<ul class="space-y-2 text-sm text-aura-muted">
					<li class="flex items-center gap-2">
						<span class="w-1.5 h-1.5 rounded-full bg-aura-gold"></span>
						Mise en ligne &lt; 5 min
					</li>
					<li class="flex items-center gap-2">
						<span class="w-1.5 h-1.5 rounded-full bg-aura-gold"></span>
						Gestion des commandes
					</li>
					<li class="flex items-center gap-2">
						<span class="w-1.5 h-1.5 rounded-full bg-aura-gold"></span>
						Dashboard intuitif
					</li>
				</ul>
			</div>

			<!-- Confiance Acheteur -->
			<div class="bg-aura-card rounded-3xl p-8 border border-aura-surface reveal-on-scroll" use:reveal={{ delay: 200 }}>
				<div class="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6">
					{#if !loaded}
						<Skeleton width="28px" height="28px" variant="circular" />
					{:else}
						<span class="material-symbols-outlined text-green-400 text-[28px]">verified_user</span>
					{/if}
				</div>
				<h3 class="text-xl font-serif mb-4">Confiance Acheteur</h3>
				<ul class="space-y-2 text-sm text-aura-muted">
					<li class="flex items-center gap-2">
						<span class="w-1.5 h-1.5 rounded-full bg-green-400"></span>
						Créateurs vérifiés
					</li>
					<li class="flex items-center gap-2">
						<span class="w-1.5 h-1.5 rounded-full bg-green-400"></span>
						Pièces documentées
					</li>
					<li class="flex items-center gap-2">
						<span class="w-1.5 h-1.5 rounded-full bg-green-400"></span>
						Paiement sécurisé (Stripe)
					</li>
				</ul>
			</div>
		</div>
	</div>
</section>

<!-- Section Stack Technique -->
<section class="py-16 md:py-24 px-6">
	<div class="max-w-7xl mx-auto">
		<SectionTitle title="Stack" subtitle="Technique" />

		<div class="grid lg:grid-cols-2 gap-12 lg:gap-16 mt-12">
			<!-- Choix techniques -->
			<div class="space-y-6 reveal-on-scroll" use:reveal>
				<h3 class="text-xl font-serif">Choix techniques</h3>

				<div class="space-y-4">
					<div class="flex items-start gap-4 p-4 bg-aura-card rounded-xl border border-aura-accent/30">
						<div class="w-10 h-10 rounded-lg bg-aura-accent/10 flex items-center justify-center shrink-0">
							{#if !loaded}
								<Skeleton width="20px" height="20px" variant="circular" />
							{:else}
								<span class="material-symbols-outlined text-aura-accent text-[20px]">hexagon</span>
							{/if}
						</div>
						<div>
							<h4 class="font-medium text-white">Architecture Hexagonale</h4>
							<p class="text-sm text-aura-muted">Séparation domaine métier / infrastructure pour une maintenabilité optimale</p>
						</div>
					</div>

					<div class="flex items-start gap-4 p-4 bg-aura-card rounded-xl border border-aura-surface">
						<div class="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
							<img src="https://cdn.simpleicons.org/nextdotjs/white" alt="Next.js" class="w-5 h-5" />
						</div>
						<div>
							<h4 class="font-medium text-white">Next.js + React</h4>
							<p class="text-sm text-aura-muted">Framework fullstack avec SSR pour une UX optimale</p>
						</div>
					</div>

					<div class="flex items-start gap-4 p-4 bg-aura-card rounded-xl border border-aura-surface">
						<div class="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
							<img src="https://cdn.simpleicons.org/postgresql/white" alt="PostgreSQL" class="w-5 h-5" />
						</div>
						<div>
							<h4 class="font-medium text-white">PostgreSQL</h4>
							<p class="text-sm text-aura-muted">Base de données relationnelle robuste et performante</p>
						</div>
					</div>

					<div class="flex items-start gap-4 p-4 bg-aura-card rounded-xl border border-aura-surface">
						<div class="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
							<img src="https://cdn.simpleicons.org/stripe/white" alt="Stripe" class="w-5 h-5" />
						</div>
						<div>
							<h4 class="font-medium text-white">Stripe Connect</h4>
							<p class="text-sm text-aura-muted">Paiements multi-vendeurs (split payments)</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Pourquoi ces choix -->
			<div class="bg-aura-card rounded-3xl p-8 border border-aura-surface reveal-on-scroll" use:reveal={{ delay: 150 }}>
				<h3 class="text-xl font-serif mb-6">Pourquoi ces choix ?</h3>

				<ul class="space-y-4 text-aura-muted">
					<li class="flex items-start gap-3">
						<span class="text-aura-accent mt-1">
							{#if !loaded}
								<Skeleton width="16px" height="16px" variant="circular" />
							{:else}
								<span class="material-symbols-outlined text-[18px]">hexagon</span>
							{/if}
						</span>
						<span><span class="text-white">Architecture Hexagonale</span> — Domaine métier isolé, testabilité maximale et évolutions simplifiées</span>
					</li>
					<li class="flex items-start gap-3">
						<span class="text-aura-accent mt-1">
							{#if !loaded}
								<Skeleton width="16px" height="16px" variant="circular" />
							{:else}
								<span class="material-symbols-outlined text-[18px]">bolt</span>
							{/if}
						</span>
						<span><span class="text-white">Écosystème React</span> — Large communauté, composants réutilisables et itérations rapides</span>
					</li>
					<li class="flex items-start gap-3">
						<span class="text-aura-accent mt-1">
							{#if !loaded}
								<Skeleton width="16px" height="16px" variant="circular" />
							{:else}
								<span class="material-symbols-outlined text-[18px]">storage</span>
							{/if}
						</span>
						<span><span class="text-white">PostgreSQL</span> — Relations complexes (créateurs, produits, commandes) gérées nativement</span>
					</li>
					<li class="flex items-start gap-3">
						<span class="text-aura-accent mt-1">
							{#if !loaded}
								<Skeleton width="16px" height="16px" variant="circular" />
							{:else}
								<span class="material-symbols-outlined text-[18px]">security</span>
							{/if}
						</span>
						<span><span class="text-white">Confiance financière</span> — Stripe Connect gère la complexité des paiements multi-parties</span>
					</li>
				</ul>
			</div>
		</div>
	</div>
</section>

<!-- Section Ce que ça change -->
<section class="py-16 md:py-24 px-6">
	<div class="max-w-7xl mx-auto">
		<SectionTitle title="Ce que ça" subtitle="change" />

		<div class="grid md:grid-cols-2 gap-12 lg:gap-16 mt-12">
			<!-- Pour les Créateurs -->
			<div class="reveal-on-scroll" use:reveal>
				<div class="flex items-center gap-3 mb-6">
					<div class="w-10 h-10 rounded-full bg-aura-accent/10 flex items-center justify-center">
						{#if !loaded}
							<Skeleton width="20px" height="20px" variant="circular" />
						{:else}
							<span class="material-symbols-outlined text-aura-accent text-[20px]">palette</span>
						{/if}
					</div>
					<h3 class="text-lg font-serif">Pour les Créateurs</h3>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="bg-aura-card rounded-xl p-4 border border-aura-surface">
						<span class="block text-2xl font-serif text-aura-accent mb-1">+50%</span>
						<span class="text-xs text-aura-muted">Temps créatif récupéré</span>
					</div>
					<div class="bg-aura-card rounded-xl p-4 border border-aura-surface">
						<span class="block text-2xl font-serif text-white mb-1">x3</span>
						<span class="text-xs text-aura-muted">Taux de conversion</span>
					</div>
				</div>
			</div>

			<!-- Pour les Acheteurs -->
			<div class="reveal-on-scroll" use:reveal={{ delay: 150 }}>
				<div class="flex items-center gap-3 mb-6">
					<div class="w-10 h-10 rounded-full bg-aura-gold/10 flex items-center justify-center">
						{#if !loaded}
							<Skeleton width="20px" height="20px" variant="circular" />
						{:else}
							<span class="material-symbols-outlined text-aura-gold text-[20px]">shopping_bag</span>
						{/if}
					</div>
					<h3 class="text-lg font-serif">Pour les Acheteurs</h3>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="bg-aura-card rounded-xl p-4 border border-aura-surface">
						<span class="block text-2xl font-serif text-aura-gold mb-1">Vérifiés</span>
						<span class="text-xs text-aura-muted">Chaque créateur</span>
					</div>
					<div class="bg-aura-card rounded-xl p-4 border border-aura-surface">
						<span class="block text-2xl font-serif text-white mb-1">Documentées</span>
						<span class="text-xs text-aura-muted">Chaque pièce</span>
					</div>
					<div class="bg-aura-card rounded-xl p-4 border border-aura-surface">
						<span class="block text-2xl font-serif text-white mb-1">Direct</span>
						<span class="text-xs text-aura-muted">Soutien au créateur</span>
					</div>
					<div class="bg-aura-card rounded-xl p-4 border border-aura-surface">
						<span class="block text-2xl font-serif text-aura-gold mb-1">Fini</span>
						<span class="text-xs text-aura-muted">Le doute</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Section Vision/Mission -->
<section class="py-16 md:py-24 px-6">
	<div class="max-w-3xl mx-auto text-center reveal-on-scroll" use:reveal>
		<blockquote class="text-2xl md:text-3xl font-serif leading-relaxed">
			"Notre mission ? Rendre la rencontre entre créateurs et acheteurs aussi <span class="text-aura-accent italic">simple</span> qu'<span class="text-aura-gold italic">évidente</span>."
		</blockquote>
	</div>
</section>

<!-- Section Témoignage -->
<section class="py-16 md:py-24 px-6 bg-aura-card relative overflow-hidden">
	<div class="max-w-4xl mx-auto text-center relative z-10 reveal-on-scroll" use:reveal>
		<div class="w-16 h-16 rounded-full bg-aura-surface flex items-center justify-center mx-auto mb-8">
			{#if !loaded}
				<Skeleton width="32px" height="32px" variant="circular" />
			{:else}
				<span class="material-symbols-outlined text-aura-accent text-[32px]">format_quote</span>
			{/if}
		</div>

		<blockquote class="text-lg md:text-xl font-serif leading-relaxed mb-8 italic">
			"Avant KPSULL, je jonglais entre Instagram, Vinted et les relances par mail — sans jamais vraiment toucher les bonnes personnes. Aujourd'hui, ma vitrine est professionnelle, mes commandes centralisées, et les acheteurs qui arrivent <span class="text-aura-accent">cherchent exactement ce que je propose</span>. Je peux enfin me concentrer sur ce que j'aime : créer."
		</blockquote>

		<div class="flex flex-col items-center gap-3">
			<div class="w-14 h-14 rounded-full bg-aura-surface flex items-center justify-center">
				{#if !loaded}
					<Skeleton width="28px" height="28px" variant="circular" />
				{:else}
					<span class="material-symbols-outlined text-aura-muted text-[28px]">person</span>
				{/if}
			</div>
			<div>
				<div class="font-medium text-white">Marie L.</div>
				<div class="text-sm text-aura-muted">Créatrice textile, Paris</div>
			</div>
		</div>
	</div>

	<!-- Decoration -->
	<div class="absolute right-10 top-10 opacity-5 -rotate-12">
		{#if loaded}
			<span class="material-symbols-outlined text-[200px]">checkroom</span>
		{/if}
	</div>
</section>
