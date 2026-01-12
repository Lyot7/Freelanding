<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import SectionTitle from '$lib/components/SectionTitle.svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { footerConfig } from '$lib/stores/footer';

	let loaded = $state(false);

	onMount(() => {
		setTimeout(() => {
			loaded = true;
		}, 600);

		// Configure footer for this page
		footerConfig.configure({
			title: 'Un projet similaire',
			titleAccent: 'en tete ?',
			description:
				'Que vous souhaitiez moderniser une infrastructure existante ou construire une nouvelle solution, discutons de vos enjeux et de la meilleure approche pour votre contexte.',
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
		// Reset footer to default when leaving page
		footerConfig.reset();
	});
</script>

<svelte:head>
	<title>MECA SERVICES - Refonte E-commerce SvelteKit | Eliott B.</title>
	<meta
		name="description"
		content="Decouvrez la refonte complete de MECA SERVICES : migration PrestaShop vers SvelteKit, accessibilite RGAA, eco-conception et performance optimisee pour une PME."
	/>
	<meta property="og:title" content="MECA SERVICES - Refonte Infrastructure E-commerce" />
	<meta
		property="og:description"
		content="Comment reconstruire une infrastructure e-commerce fiable, durable et adaptee aux contraintes d'une PME avec un seul developpeur."
	/>
	<meta property="og:image" content="/mockup-mecaservices.png" />
	<meta property="og:type" content="article" />
	<meta name="twitter:card" content="summary_large_image" />
	<link rel="canonical" href="https://eliottb.dev/projects/meca-services" />
</svelte:head>

<!-- Hero Section -->
<header class="relative min-h-[70vh] pt-24 pb-16 md:pt-32 md:pb-24 flex flex-col justify-center px-6 overflow-hidden">
	<!-- Background Glows -->
	<div
		class="absolute top-0 right-0 w-[250px] h-[250px] md:w-[500px] md:h-[500px] bg-aura-accent/5 rounded-full blur-[80px] md:blur-[120px] pointer-events-none"
	></div>
	<div
		class="absolute bottom-0 left-0 w-[150px] h-[150px] md:w-[300px] md:h-[300px] bg-aura-gold/5 rounded-full blur-[60px] md:blur-[100px] pointer-events-none"
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
					class="px-3 py-1 rounded-full border border-aura-surface text-xs text-aura-muted uppercase tracking-wider"
					>Infrastructure e-commerce</span
				>
				<span
					class="px-3 py-1 rounded-full border border-aura-surface text-xs text-aura-accent uppercase tracking-wider"
					>Refonte Totale</span
				>
			</div>

			<h1 class="text-4xl md:text-6xl font-serif leading-[1.1]">
				MECA <span class="text-aura-accent">SERVICES</span>
			</h1>

			<p class="text-xl text-aura-muted font-light">
				Refonte complete d'une infrastructure e-commerce pour une PME specialisee dans le materiel
				de motoculture.
			</p>

			<!-- Key Metrics -->
			<div class="grid grid-cols-2 gap-4 pt-4 border-t border-aura-surface">
				<div>
					<span class="block text-2xl md:text-3xl font-serif text-aura-accent">-70%</span>
					<span class="text-xs text-aura-muted">Temps de gestion</span>
				</div>
				<div>
					<span class="block text-2xl md:text-3xl font-serif text-white">x10</span>
					<span class="text-xs text-aura-muted">Experience utilisateur</span>
				</div>
			</div>
		</div>

		<!-- Hero Image -->
		<div class="reveal-on-scroll" use:reveal={{ delay: 200 }}>
			<div
				class="relative rounded-3xl overflow-hidden aspect-[4/3] border border-aura-surface shadow-2xl"
			>
				<img
					src="/mockup-mecaservices.png"
					alt="Dashboard e-commerce MECA SERVICES - Interface moderne de gestion"
					class="w-full h-full object-cover"
				/>
			</div>
		</div>
	</div>
</header>

<!-- Contexte & Defi -->
<section class="py-16 md:py-24 max-w-7xl mx-auto px-6">
	<SectionTitle title="Contexte &" subtitle="Defi" />

	<div class="grid lg:grid-cols-2 gap-12 items-start">
		<div class="space-y-6 reveal-on-scroll" use:reveal>
			<h3 class="text-2xl font-serif">L'entreprise</h3>
			<p class="text-aura-muted leading-relaxed">
				<strong class="text-white">MECA SERVICES</strong> est une PME specialisee dans la vente de materiel
				de motoculture, implantee en zone rurale avec un point de vente physique et une plateforme e-commerce.
				L'entreprise gere un catalogue de plus de <strong class="text-aura-accent">1,3 million de references</strong>,
				necessitant une infrastructure robuste et performante.
			</p>

			<h3 class="text-2xl font-serif pt-4">Le probleme</h3>
			<p class="text-aura-muted leading-relaxed">
				L'infrastructure PrestaShop existante souffrait d'une obsolescence marquee : interface
				vieillissante, PHP 7.2 en fin de vie, dette technique accumulee, et failles de securite
				non corrigees. La maintenance etait devenue un gouffre de temps et de ressources.
			</p>

			<h3 class="text-2xl font-serif pt-4">La contrainte majeure</h3>
			<p class="text-aura-muted leading-relaxed">
				Contrairement aux grands groupes disposant d'equipes pluridisciplinaires, MECA SERVICES ne
				pouvait compter que sur <strong class="text-white">un seul developpeur</strong> pour mener
				cette refonte. Il fallait donc privilegier des solutions maximisant l'efficacite tout en
				minimisant la complexite operationnelle.
			</p>
		</div>

		<!-- Tableau etat des lieux -->
		<div class="reveal-on-scroll" use:reveal={{ delay: 150 }}>
			<div class="bg-aura-card border border-aura-surface rounded-2xl overflow-hidden">
				<div class="px-6 py-4 border-b border-aura-surface bg-aura-surface/30">
					<h4 class="font-serif text-lg">Etat des lieux avant refonte</h4>
				</div>
				<div class="divide-y divide-aura-surface">
					<div class="px-6 py-4 flex justify-between items-center">
						<span class="text-aura-muted">Performance (LCP)</span>
						<span class="text-red-400 font-mono">4.2s</span>
					</div>
					<div class="px-6 py-4 flex justify-between items-center">
						<span class="text-aura-muted">Score Lighthouse</span>
						<span class="text-red-400 font-mono">42/100</span>
					</div>
					<div class="px-6 py-4 flex justify-between items-center">
						<span class="text-aura-muted">Accessibilite RGAA</span>
						<span class="text-orange-400 font-mono">Non conforme</span>
					</div>
					<div class="px-6 py-4 flex justify-between items-center">
						<span class="text-aura-muted">Temps maintenance/semaine</span>
						<span class="text-red-400 font-mono">15h+</span>
					</div>
					<div class="px-6 py-4 flex justify-between items-center">
						<span class="text-aura-muted">Dette technique</span>
						<span class="text-red-400 font-mono">Critique</span>
					</div>
					<div class="px-6 py-4 flex justify-between items-center">
						<span class="text-aura-muted">Version PHP</span>
						<span class="text-red-400 font-mono">7.2 (EOL)</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Problematique -->
<section class="py-16 md:py-20 bg-aura-card border-y border-aura-surface">
	<div class="max-w-4xl mx-auto px-6 text-center reveal-on-scroll" use:reveal>
		<span class="text-aura-accent text-sm font-semibold tracking-widest uppercase mb-4 block"
			>Problematique centrale</span
		>
		<blockquote class="text-2xl md:text-3xl font-serif leading-relaxed text-white">
			Comment reconstruire une infrastructure e-commerce
			<span class="text-aura-accent italic">fiable, durable et adaptee</span> aux contraintes d'une
			PME etant seul developpeur, tout en integrant les enjeux de
			<span class="text-aura-accent italic">performance, accessibilite et eco-conception</span> ?
		</blockquote>
	</div>
</section>

<!-- Approche & Methodologie -->
<section class="py-16 md:py-24 max-w-7xl mx-auto px-6">
	<SectionTitle title="Approche &" subtitle="Methodologie" />

	<div class="grid lg:grid-cols-2 gap-12 items-center mb-16">
		<div class="space-y-6 reveal-on-scroll" use:reveal>
			<h3 class="text-2xl font-serif">Architecture hexagonale</h3>
			<p class="text-aura-muted leading-relaxed">
				Le choix s'est porte sur une <strong class="text-white">architecture hexagonale</strong>
				(Ports & Adapters). Cette approche separe strictement le domaine metier des couches
				techniques, facilitant les tests, la maintenance et les evolutions futures.
			</p>
			<ul class="space-y-3 text-aura-muted">
				<li class="flex items-start gap-3">
					<span class="w-1.5 h-1.5 rounded-full bg-aura-accent mt-2 flex-shrink-0"></span>
					<span><strong class="text-white">Domaine isole</strong> : La logique metier ne depend d'aucun framework</span>
				</li>
				<li class="flex items-start gap-3">
					<span class="w-1.5 h-1.5 rounded-full bg-aura-accent mt-2 flex-shrink-0"></span>
					<span><strong class="text-white">Testabilite maximale</strong> : Chaque couche testable independamment</span>
				</li>
				<li class="flex items-start gap-3">
					<span class="w-1.5 h-1.5 rounded-full bg-aura-accent mt-2 flex-shrink-0"></span>
					<span><strong class="text-white">Adaptateurs interchangeables</strong> : Changement de BDD ou d'API sans impact metier</span>
				</li>
			</ul>
		</div>

		<div class="space-y-6 reveal-on-scroll" use:reveal={{ delay: 150 }}>
			<h3 class="text-2xl font-serif">Migration Big Bang</h3>
			<p class="text-aura-muted leading-relaxed">
				Le changement complet de stack technique (PrestaShop/MySQL vers SvelteKit/PostgreSQL)
				imposait une <strong class="text-white">migration Big Bang</strong>. L'incompatibilite
				des bases de donnees rendait impossible une migration progressive type Strangler Fig.
			</p>
			<div class="bg-aura-surface/30 border border-aura-surface rounded-xl p-4">
				<p class="text-sm text-aura-accent mb-2">Strategie mise en place</p>
				<ul class="text-sm text-aura-muted space-y-2">
					<li>Developpement complet en parallele de l'ancien systeme</li>
					<li>Phase de tests intensifs avant bascule</li>
					<li>Migration des donnees via scripts ETL dedies</li>
				</ul>
			</div>
		</div>
	</div>

	<!-- Schema Migration -->
	<div class="reveal-on-scroll" use:reveal={{ delay: 200 }}>
		<div class="bg-aura-card border border-aura-surface rounded-3xl p-6 md:p-8">
			<img
				src="/diagrams/migration-strategy.svg"
				alt="Schema de la strategie de migration Big Bang - Developpement parallele et bascule"
				class="w-full h-auto"
			/>
		</div>
	</div>
</section>

<!-- Stack Technique -->
<section class="py-16 md:py-24 bg-[#121E1C] overflow-hidden">
	<div class="max-w-7xl mx-auto px-6">
		<SectionTitle title="Stack" subtitle="Technique" />

		<div class="grid lg:grid-cols-2 gap-12 items-start mb-12">
			<div class="space-y-6 reveal-on-scroll" use:reveal>
				<h3 class="text-2xl font-serif">Pourquoi SvelteKit ?</h3>
				<p class="text-aura-muted leading-relaxed">
					Face a Next.js, Nuxt ou Remix, <strong class="text-aura-accent">SvelteKit</strong> s'impose
					par sa philosophie unique : <strong class="text-white">compiler plutot qu'interpreter</strong>.
					Pour un developpeur solo gerant un projet complexe, c'est un avantage decisif.
				</p>
				<ul class="space-y-3 text-aura-muted">
					<li class="flex items-start gap-3">
						<span class="w-1.5 h-1.5 rounded-full bg-aura-accent mt-2 flex-shrink-0"></span>
						<span><strong class="text-white">Complexite cognitive minimale</strong> : Syntaxe intuitive proche du HTML/CSS/JS natif. Pas de JSX, pas de hooks complexes, pas de magie cachee. Le code fait exactement ce qu'il dit.</span>
					</li>
					<li class="flex items-start gap-3">
						<span class="w-1.5 h-1.5 rounded-full bg-aura-accent mt-2 flex-shrink-0"></span>
						<span><strong class="text-white">Maintenabilite exceptionnelle</strong> : Un composant = un fichier. La reactivite est declarative, pas imperative. Reprendre le code apres 6 mois reste simple.</span>
					</li>
					<li class="flex items-start gap-3">
						<span class="w-1.5 h-1.5 rounded-full bg-aura-accent mt-2 flex-shrink-0"></span>
						<span><strong class="text-white">Bundle size ridicule</strong> : Svelte compile en JavaScript vanilla. Pas de runtime de 40Ko+ comme React. Le bundle final est 2 a 5x plus leger.</span>
					</li>
					<li class="flex items-start gap-3">
						<span class="w-1.5 h-1.5 rounded-full bg-aura-accent mt-2 flex-shrink-0"></span>
						<span><strong class="text-white">Performance native</strong> : Sans Virtual DOM, les mises a jour sont chirurgicales. Le navigateur travaille moins, l'utilisateur percoit plus de fluidite.</span>
					</li>
				</ul>
			</div>

			<!-- Tableau comparatif -->
			<div class="reveal-on-scroll" use:reveal={{ delay: 150 }}>
				<div class="bg-aura-card border border-aura-surface rounded-2xl overflow-hidden">
					<div class="px-6 py-4 border-b border-aura-surface bg-aura-surface/30">
						<h4 class="font-serif text-lg">Comparatif frameworks</h4>
					</div>
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b border-aura-surface">
									<th class="px-2 md:px-4 py-3 text-left text-aura-muted font-normal text-xs md:text-sm">Critere</th>
									<th class="px-2 md:px-4 py-3 text-center text-aura-accent font-medium text-xs md:text-sm">SvelteKit</th>
									<th class="px-2 md:px-4 py-3 text-center text-aura-muted font-normal text-xs md:text-sm">Next.js</th>
									<th class="px-2 md:px-4 py-3 text-center text-aura-muted font-normal text-xs md:text-sm">Nuxt</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-aura-surface text-xs md:text-sm">
								<tr>
									<td class="px-2 md:px-4 py-3 text-aura-muted">Bundle size</td>
									<td class="px-2 md:px-4 py-3 text-center text-green-400">~5 Ko</td>
									<td class="px-2 md:px-4 py-3 text-center text-orange-400">~80 Ko</td>
									<td class="px-2 md:px-4 py-3 text-center text-orange-400">~60 Ko</td>
								</tr>
								<tr>
									<td class="px-2 md:px-4 py-3 text-aura-muted">Complexite cognitive</td>
									<td class="px-2 md:px-4 py-3 text-center text-green-400">Faible</td>
									<td class="px-2 md:px-4 py-3 text-center text-orange-400">Elevee</td>
									<td class="px-2 md:px-4 py-3 text-center text-orange-400">Moyenne</td>
								</tr>
								<tr>
									<td class="px-2 md:px-4 py-3 text-aura-muted">Developer Experience</td>
									<td class="px-2 md:px-4 py-3 text-center text-green-400">Excellente</td>
									<td class="px-2 md:px-4 py-3 text-center text-orange-400">Bonne</td>
									<td class="px-2 md:px-4 py-3 text-center text-orange-400">Bonne</td>
								</tr>
								<tr>
									<td class="px-2 md:px-4 py-3 text-aura-muted">Performance runtime</td>
									<td class="px-2 md:px-4 py-3 text-center text-green-400">Native</td>
									<td class="px-2 md:px-4 py-3 text-center text-orange-400">VDOM</td>
									<td class="px-2 md:px-4 py-3 text-center text-orange-400">VDOM</td>
								</tr>
								<tr>
									<td class="px-2 md:px-4 py-3 text-aura-muted">Maintenabilite solo</td>
									<td class="px-2 md:px-4 py-3 text-center text-green-400">Ideale</td>
									<td class="px-2 md:px-4 py-3 text-center text-orange-400">Difficile</td>
									<td class="px-2 md:px-4 py-3 text-center text-orange-400">Moyenne</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>

		<!-- Schema Stack -->
		<div class="reveal-on-scroll" use:reveal={{ delay: 200 }}>
			<div class="bg-aura-card border border-aura-surface rounded-3xl p-6 md:p-8">
				<img
					src="/diagrams/tech-stack.svg"
					alt="Architecture technique complete - Frontend SvelteKit, Backend Bun, Database PostgreSQL, Infrastructure Railway"
					class="w-full h-auto"
				/>
			</div>
		</div>
	</div>
</section>

<!-- Enjeux RSE -->
<section class="py-16 md:py-24 max-w-7xl mx-auto px-6">
	<SectionTitle title="Enjeux" subtitle="RSE" />

	<div class="grid md:grid-cols-3 gap-8 mb-12">
		<!-- Accessibilite -->
		<div
			class="reveal-on-scroll bg-aura-card p-8 rounded-2xl border border-aura-surface"
			use:reveal
		>
			<div
				class="w-12 h-12 rounded-full bg-aura-accent/20 flex items-center justify-center mb-4"
			>
				{#if !loaded}
					<Skeleton width="24px" height="24px" variant="circular" />
				{:else}
					<span class="material-symbols-outlined text-aura-accent">accessibility_new</span>
				{/if}
			</div>
			<h3 class="text-xl font-serif mb-3">Accessibilite</h3>
			<p class="text-aura-muted text-sm leading-relaxed mb-4">
				Conformite aux normes <strong class="text-white">WCAG 2.1 niveau AA</strong> et au
				referentiel <strong class="text-white">RGAA 4.1.2</strong>. Obligation legale depuis
				l'European Accessibility Act (juin 2025).
			</p>
			<ul class="text-xs text-aura-muted space-y-2">
				<li class="flex items-center gap-2">
					<span class="w-1 h-1 rounded-full bg-aura-accent"></span>Checklist RGAA integree au workflow
				</li>
				<li class="flex items-center gap-2">
					<span class="w-1 h-1 rounded-full bg-aura-accent"></span>Composants accessibles by design
				</li>
				<li class="flex items-center gap-2">
					<span class="w-1 h-1 rounded-full bg-aura-accent"></span>Tests utilisateurs avec handicap
				</li>
			</ul>
		</div>

		<!-- Eco-conception -->
		<div
			class="reveal-on-scroll bg-aura-card p-8 rounded-2xl border border-aura-surface"
			use:reveal={{ delay: 100 }}
		>
			<div
				class="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4"
			>
				{#if !loaded}
					<Skeleton width="24px" height="24px" variant="circular" />
				{:else}
					<span class="material-symbols-outlined text-green-400">eco</span>
				{/if}
			</div>
			<h3 class="text-xl font-serif mb-3">Eco-conception</h3>
			<p class="text-aura-muted text-sm leading-relaxed mb-4">
				Application des principes du <strong class="text-white">RGESN</strong> (Referentiel General
				d'Ecoconception des Services Numeriques) pour minimiser l'impact environnemental.
			</p>
			<ul class="text-xs text-aura-muted space-y-2">
				<li class="flex items-center gap-2">
					<span class="w-1 h-1 rounded-full bg-green-400"></span>Optimisation images (WebP, lazy loading)
				</li>
				<li class="flex items-center gap-2">
					<span class="w-1 h-1 rounded-full bg-green-400"></span>Hebergement responsable
				</li>
				<li class="flex items-center gap-2">
					<span class="w-1 h-1 rounded-full bg-green-400"></span>Code efficient, requetes minimisees
				</li>
			</ul>
		</div>

		<!-- DevOps & Qualite -->
		<div
			class="reveal-on-scroll bg-aura-card p-8 rounded-2xl border border-aura-surface"
			use:reveal={{ delay: 200 }}
		>
			<div
				class="w-12 h-12 rounded-full bg-aura-gold/20 flex items-center justify-center mb-4"
			>
				{#if !loaded}
					<Skeleton width="24px" height="24px" variant="circular" />
				{:else}
					<span class="material-symbols-outlined text-aura-gold">verified</span>
				{/if}
			</div>
			<h3 class="text-xl font-serif mb-3">DevOps & Qualite</h3>
			<p class="text-aura-muted text-sm leading-relaxed mb-4">
				Pipeline CI/CD automatise pour garantir la qualite du code et la stabilite des
				deploiements. Integration de tests et monitoring continu.
			</p>
			<ul class="text-xs text-aura-muted space-y-2">
				<li class="flex items-center gap-2">
					<span class="w-1 h-1 rounded-full bg-aura-gold"></span>GitHub Actions + SonarCloud
				</li>
				<li class="flex items-center gap-2">
					<span class="w-1 h-1 rounded-full bg-aura-gold"></span>Tests unitaires & E2E (Vitest, Playwright)
				</li>
				<li class="flex items-center gap-2">
					<span class="w-1 h-1 rounded-full bg-aura-gold"></span>Monitoring & alerting
				</li>
			</ul>
		</div>
	</div>

	<!-- Schema Architecture -->
	<div class="reveal-on-scroll" use:reveal={{ delay: 250 }}>
		<div class="bg-aura-card border border-aura-surface rounded-3xl p-6 md:p-8">
			<img
				src="/diagrams/architecture-before-after.svg"
				alt="Comparaison avant-apres - Architecture PrestaShop legacy vs SvelteKit modulaire"
				class="w-full h-auto"
			/>
		</div>
	</div>
</section>

<!-- Resultats & Impact -->
<section class="py-16 md:py-24 bg-aura-card border-y border-aura-surface overflow-hidden">
	<div class="max-w-7xl mx-auto px-6">
		<SectionTitle title="Resultats &" subtitle="Impact" />

		<div class="grid lg:grid-cols-2 gap-12 items-start">
			<!-- Tableau comparatif -->
			<div class="reveal-on-scroll" use:reveal>
				<div class="bg-aura-bg border border-aura-surface rounded-2xl overflow-hidden">
					<div class="px-6 py-4 border-b border-aura-surface">
						<h4 class="font-serif text-lg">Metriques avant / apres</h4>
					</div>
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b border-aura-surface">
									<th class="px-2 md:px-4 py-3 text-left text-aura-muted font-normal text-xs md:text-sm">Metrique</th>
									<th class="px-2 md:px-4 py-3 text-center text-red-400 font-normal text-xs md:text-sm">Avant</th>
									<th class="px-2 md:px-4 py-3 text-center text-green-400 font-normal text-xs md:text-sm">Apres</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-aura-surface text-xs md:text-sm">
								<tr>
									<td class="px-2 md:px-4 py-3 text-aura-muted">LCP (Largest Contentful Paint)</td>
									<td class="px-2 md:px-4 py-3 text-center text-red-400 font-mono">4.2s</td>
									<td class="px-2 md:px-4 py-3 text-center text-green-400 font-mono">1.1s</td>
								</tr>
								<tr>
									<td class="px-2 md:px-4 py-3 text-aura-muted">FID (First Input Delay)</td>
									<td class="px-2 md:px-4 py-3 text-center text-red-400 font-mono">180ms</td>
									<td class="px-2 md:px-4 py-3 text-center text-green-400 font-mono">12ms</td>
								</tr>
								<tr>
									<td class="px-2 md:px-4 py-3 text-aura-muted">CLS (Cumulative Layout Shift)</td>
									<td class="px-2 md:px-4 py-3 text-center text-orange-400 font-mono">0.18</td>
									<td class="px-2 md:px-4 py-3 text-center text-green-400 font-mono">0.02</td>
								</tr>
								<tr>
									<td class="px-2 md:px-4 py-3 text-aura-muted">Score Lighthouse</td>
									<td class="px-2 md:px-4 py-3 text-center text-red-400 font-mono">42</td>
									<td class="px-2 md:px-4 py-3 text-center text-green-400 font-mono">95+</td>
								</tr>
								<tr>
									<td class="px-2 md:px-4 py-3 text-aura-muted">Accessibilite RGAA</td>
									<td class="px-2 md:px-4 py-3 text-center text-red-400">Non conforme</td>
									<td class="px-2 md:px-4 py-3 text-center text-green-400">Niveau AA</td>
								</tr>
								<tr>
									<td class="px-2 md:px-4 py-3 text-aura-muted">Empreinte carbone / page</td>
									<td class="px-2 md:px-4 py-3 text-center text-red-400 font-mono">2.8g CO2</td>
									<td class="px-2 md:px-4 py-3 text-center text-green-400 font-mono">0.4g CO2</td>
								</tr>
								<tr>
									<td class="px-2 md:px-4 py-3 text-aura-muted">Temps maintenance / semaine</td>
									<td class="px-2 md:px-4 py-3 text-center text-red-400 font-mono">15h</td>
									<td class="px-2 md:px-4 py-3 text-center text-green-400 font-mono">3h</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<!-- Impacts business -->
			<div class="space-y-6 reveal-on-scroll" use:reveal={{ delay: 150 }}>
				<h3 class="text-2xl font-serif">Impacts business</h3>

				<div class="space-y-4">
					<div class="bg-aura-bg border border-aura-surface rounded-xl p-5">
						<div class="flex items-center justify-between mb-2">
							<span class="text-aura-muted">Temps de gestion</span>
							<span class="text-2xl font-serif text-aura-accent">-80%</span>
						</div>
						<p class="text-xs text-aura-muted">
							Interface simplifiee, processus automatises, moins d'interventions manuelles.
						</p>
					</div>

					<div class="bg-aura-bg border border-aura-surface rounded-xl p-5">
						<div class="flex items-center justify-between mb-2">
							<span class="text-aura-muted">Satisfaction client</span>
							<span class="text-2xl font-serif text-aura-accent">x3</span>
						</div>
						<p class="text-xs text-aura-muted">
							Experience utilisateur fluide, temps de chargement reduits, navigation intuitive.
						</p>
					</div>

					<div class="bg-aura-bg border border-aura-surface rounded-xl p-5">
						<div class="flex items-center justify-between mb-2">
							<span class="text-aura-muted">Conformite legale</span>
							<span class="text-2xl font-serif text-green-400">100%</span>
						</div>
						<p class="text-xs text-aura-muted">
							Pret pour l'European Accessibility Act et les exigences RGPD.
						</p>
					</div>

					<div class="bg-aura-bg border border-aura-surface rounded-xl p-5">
						<div class="flex items-center justify-between mb-2">
							<span class="text-aura-muted">Referencement naturel</span>
							<span class="text-2xl font-serif text-aura-gold">+45%</span>
						</div>
						<p class="text-xs text-aura-muted">
							Core Web Vitals optimises, structure semantique, performance mobile.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Testimonial -->
<section class="py-16 md:py-24">
	<div class="max-w-4xl mx-auto px-6 text-center reveal-on-scroll" use:reveal>
		{#if !loaded}
			<Skeleton width="64px" height="64px" variant="circular" className="mx-auto mb-8" />
		{:else}
			<span class="material-symbols-outlined text-6xl text-aura-accent mb-8 opacity-50"
				>format_quote</span
			>
		{/if}
		<blockquote class="text-xl md:text-3xl font-serif leading-relaxed mb-10 text-white">
			"Eliott a repense notre infrastructure e-commerce et nos outils internes. En seulement un an
			d'alternance, il a transforme notre dette technique en une infrastructure scalable et
			performante, <span class="text-aura-accent italic"
				>posant les bases d'une croissance durable</span
			>."
		</blockquote>

		<div class="flex flex-col items-center justify-center gap-4">
			<img
				src="/jerome-davy.png"
				class="w-16 h-16 rounded-full object-cover border-2 border-aura-accent p-1"
				alt="Jerome DAVY, PDG de MECA SERVICES"
			/>
			<div>
				<div class="font-bold text-lg">Jerome DAVY</div>
				<div class="text-sm text-aura-muted">PDG de MECA SERVICES</div>
			</div>
		</div>
	</div>
</section>
