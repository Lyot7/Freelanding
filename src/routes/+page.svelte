<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import SectionTitle from '$lib/components/SectionTitle.svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { projects } from '$lib/data/projects';

	// Images optimisées
	import myPic from '$lib/assets/images/my-pic.png?enhanced';
	import jeromeDavy from '$lib/assets/images/jerome-davy.png?enhanced';
	import mockupMeca from '$lib/assets/images/mockup-mecaservices.png?enhanced';
	import mockupKpsull from '$lib/assets/images/mockup-kpsull.png?enhanced';

	// Mapping des images de projets par slug
	const projectImages: Record<string, typeof mockupMeca> = {
		'meca-services': mockupMeca,
		'kpsull': mockupKpsull
	};

	// Loading state
	let loaded = $state(false);

	onMount(() => {
		// Short delay for fonts to load, optimized for LCP
		setTimeout(() => {
			loaded = true;
		}, 100);
	});

	// Simulator state
	let employees = $state(10);
	let salary = $state(4000);
	let hours = $state(5);
    // ... rest of simulator state


	// Computed values
	let annualSaving = $derived(() => {
		const hourlyCost = salary / 151.67;
		return Math.round(hourlyCost * hours * 47 * employees);
	});

	let annualHours = $derived(() => {
		return Math.round(hours * 47 * employees);
	});

	let fullTimeEquivalent = $derived(() => {
		return (annualHours() / 1607).toFixed(1);
	});

	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('fr-FR', {
			style: 'currency',
			currency: 'EUR',
			maximumFractionDigits: 0
		}).format(value);
	}

	function formatNumber(value: number): string {
		return new Intl.NumberFormat('fr-FR').format(value);
	}

	function setPreset(type: 'startup' | 'pme') {
		if (type === 'startup') {
			employees = 10;
			salary = 3500;
			hours = 8;
		} else {
			employees = 50;
			salary = 4000;
			hours = 4;
		}
	}
</script>

<style>
	.slider-wrapper {
		position: relative;
		height: 20px;
		display: flex;
		align-items: center;
	}

	.slider-wrapper::before {
		content: '';
		position: absolute;
		left: 0;
		top: 4px;
		height: 12px;
		width: var(--progress, 0%);
		background: rgba(111, 240, 211, 0.4);
		border-radius: 6px 0 0 6px;
		pointer-events: none;
		z-index: 1;
	}

	input[type="range"] {
		-webkit-appearance: none;
		appearance: none;
		height: 20px;
		background: transparent;
		border-radius: 4px;
		outline: none;
		padding: 0;
		margin: 0;
		position: relative;
		z-index: 2;
	}

	input[type="range"]::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		background: #6ff0d3;
		border-radius: 50%;
		cursor: pointer;
		border: none;
		box-shadow: 0 0 8px rgba(111, 240, 211, 0.8), 0 0 12px rgba(111, 240, 211, 0.5);
		margin-top: -4px;
	}

	input[type="range"]::-moz-range-thumb {
		width: 20px;
		height: 20px;
		background: #6ff0d3;
		border-radius: 50%;
		cursor: pointer;
		border: none;
		box-shadow: 0 0 8px rgba(111, 240, 211, 0.8), 0 0 12px rgba(111, 240, 211, 0.5);
	}

	input[type="range"]::-webkit-slider-track {
		height: 12px;
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.1);
		margin-top: 4px;
	}

	input[type="range"]::-webkit-slider-runnable-track {
		height: 12px;
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.1);
	}

	input[type="range"]::-moz-range-track {
		height: 12px;
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.1);
	}
	
	input[type="range"]::-moz-range-progress {
		height: 12px;
		border-radius: 6px 0 0 6px;
		background: rgba(111, 240, 211, 0.4);
	}
</style>

<svelte:head>
	<title>Eliott B. - Architecture Web & Stratégie IA | Freelance</title>
	<meta 
		name="description" 
		content="Ne construisez pas juste un site, bâtissez votre avantage compétitif. Expert en architecture web moderne et automatisation IA pour maximiser votre rentabilité et votre croissance." 
	/>
	<meta name="keywords" content="Freelance Web, SvelteKit, Intelligence Artificielle, Automatisation, Architecture Web, Performance, SEO, Rentabilité" />
	<link rel="canonical" href="https://eliottbouquerel.fr" />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://eliottbouquerel.fr/" />
	<meta property="og:title" content="Eliott B. - Architecture Web & Stratégie IA" />
	<meta property="og:description" content="Développeur & Stratège. Je conçois l'infrastructure numérique invisible qui porte votre croissance. Web performant & Agents IA." />
	<meta property="og:image" content="https://eliottbouquerel.fr/og-image.jpg" />

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content="https://eliottbouquerel.fr/" />
	<meta property="twitter:title" content="Eliott B. - Architecture Web & Stratégie IA" />
	<meta property="twitter:description" content="Développeur & Stratège. Je conçois l'infrastructure numérique invisible qui porte votre croissance." />
	<meta property="twitter:image" content="https://eliottbouquerel.fr/og-image.jpg" />
</svelte:head>

<!-- Hero Section -->
	<header
		id="top"
		class="relative min-h-screen pt-32 pb-12 md:pt-32 md:pb-20 flex flex-col justify-center px-6"
	>
		<!-- Abstract Background Glows -->
		<div
			class="absolute top-0 right-0 w-[600px] h-[600px] bg-aura-accent/5 rounded-full blur-[120px] pointer-events-none"
		></div>
		<div
			class="absolute bottom-0 left-0 w-[400px] h-[400px] bg-aura-gold/5 rounded-full blur-[100px] pointer-events-none"
		></div>

		<div class="max-w-7xl mx-auto w-full grid lg:grid-cols-12 gap-10 lg:gap-16 items-center z-10">
			<!-- Left Content -->
			<div class="lg:col-span-7 space-y-8 md:space-y-10 reveal-on-scroll" use:reveal>
				<div
					class="hidden lg:inline-flex items-center gap-2 px-3 py-1 rounded-full border border-aura-surface bg-aura-card/50"
				>
					{#if !loaded}
						<Skeleton width="16px" height="16px" variant="circular" />
						<Skeleton width="150px" height="12px" />
					{:else}
						<span class="material-symbols-outlined text-[16px] text-aura-accent shrink-0">verified</span>
						<span class="text-xs uppercase tracking-widest text-aura-muted truncate"
							>Développeur & Manager de projet Web</span
						>
					{/if}
				</div>

				<h1 class="text-4xl md:text-6xl font-serif leading-[1.05]">
					Automatisez ce qui ralentit, <span class="text-aura-accent italic">accélérez ce qui rapporte</span>.
				</h1>

				<p class="text-lg md:text-xl text-aura-muted font-light max-w-2xl leading-relaxed">
					Vos équipes perdent des heures sur des tâches répétitives. Je crée des solutions web et IA qui les font à leur place, plus vite et sans erreur. Résultat : vos équipes se concentrent sur ce qui fait vraiment grandir votre business.
				</p>

				<div class="flex flex-col sm:flex-row gap-4 md:gap-5 pt-4">
					{#if !loaded}
						<Skeleton width="180px" height="48px" className="rounded-xl" />
						<Skeleton width="220px" height="48px" className="rounded-xl" />
					{:else}
						<Button href="#simulator" variant="primary">
							Simuler mes gains
							<span class="material-symbols-outlined ml-2 text-sm transition-transform group-hover:translate-x-1">payments</span>
						</Button>
						<Button href="/rendez-vous" variant="secondary">
							Prendre rendez-vous
							<span class="material-symbols-outlined text-sm">calendar_today</span>
						</Button>
					{/if}
				</div>

				</div>

			<!-- Right Visual (Hero Image) - No animation delay for LCP optimization -->
			<div class="lg:col-span-5 relative max-w-xs md:max-w-md mx-auto lg:max-w-none w-full">
                <div
					class="relative w-full aspect-[3/4] rounded-t-[100px] rounded-b-[30px] overflow-hidden border border-aura-surface"
				>
					<!-- Image Placeholder for Eliott -->
					<enhanced:img
						src={myPic}
						alt="Eliott Bouquerel"
						class="w-full h-full object-cover"
						fetchpriority="high"
					/>

					<!-- Title Badge (Mobile/Tablet only) -->
					<div
						class="lg:hidden absolute bottom-6 left-1/2 -translate-x-1/2 inline-flex items-center gap-3 px-5 py-3 rounded-2xl border border-aura-surface bg-aura-card/80 backdrop-blur-xl shadow-2xl w-[calc(100%-3rem)]"
					>
						{#if !loaded}
							<Skeleton width="20px" height="20px" variant="circular" />
							<Skeleton width="150px" height="14px" />
						{:else}
							<span class="material-symbols-outlined text-[20px] text-aura-accent shrink-0">verified</span>
							<span class="text-xs sm:text-sm uppercase tracking-widest text-aura-muted text-center"
								>Développeur & Manager de projet Web</span
							>
						{/if}
					</div>

					<!-- Floating Card (Desktop only) -->
					<div
						class="hidden lg:block absolute bottom-8 left-8 right-8 bg-aura-bg/80 backdrop-blur-xl border border-aura-surface p-5 rounded-2xl shadow-2xl"
					>
						<div class="flex justify-between items-start">
							<div>
								<p class="text-xs text-aura-accent uppercase tracking-wider mb-1">
									Dernière Mission
								</p>
								<p class="font-serif text-lg leading-tight">Infrastructure E-commerce</p>
							</div>
							<span class="bg-aura-surface p-2 rounded-full text-aura-accent">
								{#if !loaded}
									<Skeleton width="20px" height="20px" variant="circular" />
								{:else}
									<span class="material-symbols-outlined">store</span>
								{/if}
							</span>
						</div>
						<div class="mt-3 flex items-center gap-2 text-sm text-aura-muted">
							{#if !loaded}
								<Skeleton width="100px" height="16px" />
								<span class="w-1 h-1 rounded-full bg-aura-surface"></span>
								<Skeleton width="80px" height="16px" />
							{:else}
								<span class="flex items-center text-aura-accent"
									><span class="material-symbols-outlined text-[16px] mr-1">speed</span> -80% Temps gestion</span
								>
								<span class="w-1 h-1 rounded-full bg-aura-surface"></span>
								<span>Refonte Totale</span>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	</header>

	<!-- Value Proposition -->
	<section class="py-14 md:py-24 max-w-7xl mx-auto px-6 scroll-mt-32" id="expertise">
		<SectionTitle title="Expertise" subtitle="Premium" />

		<div class="grid md:grid-cols-3 gap-6">
			<!-- Card 1 -->
			<div
				class="reveal-on-scroll aura-card bg-aura-card p-10 rounded-[32px] border border-aura-surface relative overflow-hidden group"
				use:reveal={{ delay: 100 }}
			>
				<div
					class="absolute top-0 right-0 opacity-10 group-hover:opacity-15 transition-opacity pointer-events-none"
				>
					<span class="material-symbols-outlined" style="font-size: 200px; line-height: 1;">architecture</span>
				</div>
				<h3 class="text-2xl font-serif mb-4">Architecture & Refonte</h3>
				<p class="text-aura-muted leading-relaxed mb-8">
					Je ne fais pas que coder, je repense la structure même de vos outils. Obsédé par la
					performance et la scalabilité de votre infrastructure.
				</p>
				<ul class="space-y-3 text-sm text-aura-muted border-t border-aura-surface pt-6">
					<li class="flex items-center gap-2">
						<span class="w-1.5 h-1.5 rounded-full bg-aura-accent"></span>Modernisation Legacy
					</li>
					<li class="flex items-center gap-2">
						<span class="w-1.5 h-1.5 rounded-full bg-aura-accent"></span>Architecture hexagonale
					</li>
				</ul>
			</div>

			<!-- Card 2 -->
			<div
				class="reveal-on-scroll aura-card bg-aura-card p-10 rounded-[32px] border border-aura-accent/30 relative overflow-hidden group shadow-[0_0_30px_rgba(111,240,211,0.05)]"
				use:reveal={{ delay: 200 }}
			>
				<div
					class="absolute top-0 right-0 opacity-10 group-hover:opacity-15 transition-opacity pointer-events-none"
				>
					<span class="material-symbols-outlined text-aura-accent" style="font-size: 200px; line-height: 1;">psychology</span>
				</div>
				<h3 class="text-2xl font-serif mb-4 text-white">Intégration IA</h3>
				<p class="text-aura-muted leading-relaxed mb-8">
					Le cœur de mon offre. Déploiement d'agents autonomes qui travaillent pour vous pendant
					que vous dormez. Support, analyse, rédaction.
				</p>
				<ul class="space-y-3 text-sm text-aura-muted border-t border-aura-surface pt-6">
					<li class="flex items-center gap-2">
						<span class="w-1.5 h-1.5 rounded-full bg-aura-accent"></span>Agents personnalisés
					</li>
					<li class="flex items-center gap-2">
						<span class="w-1.5 h-1.5 rounded-full bg-aura-accent"></span>Automatisation N8N
					</li>
				</ul>
			</div>

			<!-- Card 3 -->
			<div
				class="reveal-on-scroll aura-card bg-aura-card p-10 rounded-[32px] border border-aura-surface relative overflow-hidden group"
				use:reveal={{ delay: 300 }}
			>
				<div
					class="absolute top-0 right-0 opacity-10 group-hover:opacity-15 transition-opacity pointer-events-none"
				>
					<span class="material-symbols-outlined" style="font-size: 200px; line-height: 1;">speed</span>
				</div>
				<h3 class="text-2xl font-serif mb-4">Audit de Productivité</h3>
				<p class="text-aura-muted leading-relaxed mb-8">
					Avant toute ligne de code, une analyse profonde de vos processus. J'identifie où vous
					perdez de l'argent et comment le récupérer.
				</p>
				<ul class="space-y-3 text-sm text-aura-muted border-t border-aura-surface pt-6">
					<li class="flex items-center gap-2">
						<span class="w-1.5 h-1.5 rounded-full bg-aura-accent"></span>Audit Technique
					</li>
					<li class="flex items-center gap-2">
						<span class="w-1.5 h-1.5 rounded-full bg-aura-accent"></span>Roadmap ROI
					</li>
				</ul>
			</div>
		</div>
	</section>

	<!-- Interactive Simulator -->
	<section class="py-14 md:py-24 bg-[#121E1C] relative overflow-hidden scroll-mt-32" id="simulator">
		<div class="max-w-6xl mx-auto px-6 relative z-10">
			<div class="grid lg:grid-cols-12 gap-12 items-center">
				<!-- Text Area -->
				<div class="lg:col-span-4 reveal-on-scroll" use:reveal>
					<span class="text-aura-accent text-sm font-semibold tracking-widest uppercase mb-2 block"
						>Projection Réelle</span
					>
					<SectionTitle title="Combien vous coûte" subtitle="l'immobilisme ?" align="left" />
					<p class="text-aura-muted mb-8 text-sm leading-relaxed">
						Ce simulateur n'est pas un gadget. Il se base sur les métriques moyennes observées chez
						mes clients post-transition IA. Visualisez le capital que vous pourriez réinvestir.
					</p>

					<!-- Presets -->
					<div class="space-y-3">
						<p class="text-xs text-aura-muted uppercase tracking-wider">Scénarios types :</p>
						<div class="flex gap-2 flex-wrap">
							<button
								onclick={() => setPreset('startup')}
								class="px-4 py-2 rounded-lg bg-aura-surface hover:bg-aura-accent hover:text-aura-bg transition-colors text-xs font-medium border border-transparent hover:border-aura-accent"
							>
								Startup (10 pers)
							</button>
							<button
								onclick={() => setPreset('pme')}
								class="px-4 py-2 rounded-lg bg-aura-surface hover:bg-aura-accent hover:text-aura-bg transition-colors text-xs font-medium border border-transparent hover:border-aura-accent"
							>
								PME (50 pers)
							</button>
						</div>
					</div>
				</div>

				<!-- Calculator Interface -->
				<div class="lg:col-span-8 reveal-on-scroll" use:reveal={{ delay: 200 }}>
					<div
						class="bg-aura-card border border-aura-surface p-8 md:p-12 rounded-[40px] shadow-2xl backdrop-blur-sm"
					>
						<!-- Sliders Grid -->
						<div class="grid md:grid-cols-2 gap-x-12 gap-y-10 mb-12">
							<div class="space-y-4">
								<div class="flex justify-between items-baseline">
									<label for="employees-slider" class="text-sm font-medium text-aura-muted">Effectif concerné</label>
									<span class="text-2xl font-serif text-white">{employees}</span>
								</div>
								<div class="slider-wrapper" style="--progress: {(employees - 1) / (100 - 1) * 100}%">
									<input
										id="employees-slider"
										type="range"
										bind:value={employees}
										min="1"
										max="100"
										step="1"
										class="w-full"
										aria-label="Effectif concerné"
									/>
								</div>
							</div>

							<div class="space-y-4">
								<div class="flex justify-between items-baseline">
									<label for="salary-slider" class="text-sm font-medium text-aura-muted">Salaire moyen charge /mois</label>
								<span class="text-2xl font-serif text-white">{salary} €</span>
								</div>
								<div class="slider-wrapper" style="--progress: {(salary - 2000) / (10000 - 2000) * 100}%">
									<input
										id="salary-slider"
										type="range"
										bind:value={salary}
										min="2000"
										max="10000"
										step="100"
										class="w-full"
										aria-label="Salaire moyen chargé par mois"
									/>
								</div>
							</div>

							<div class="space-y-4 md:col-span-2">
								<div class="flex justify-between items-baseline">
									<label for="hours-slider" class="text-sm font-medium text-aura-muted">Heures automatisables /semaine /pers</label>
									<span class="text-2xl font-serif text-white text-aura-accent">{hours} h</span>
								</div>
								<div class="slider-wrapper" style="--progress: {(hours - 1) / (20 - 1) * 100}%">
									<input
										id="hours-slider"
										type="range"
										bind:value={hours}
										min="1"
										max="20"
										step="0.5"
										class="w-full"
										aria-label="Heures automatisables par semaine par personne"
									/>
								</div>
								<p class="text-xs text-aura-muted mt-1">
									Saisie, reporting, tri d'emails, recherche documentaire...
								</p>
							</div>
						</div>

						<!-- Results Dashboard -->
						<div
							class="bg-[#0A110F] rounded-3xl p-6 md:p-8 border border-aura-surface/50 space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-8 md:items-center relative overflow-hidden"
						>
							<div
								class="absolute top-0 right-0 w-32 h-32 bg-aura-accent/10 blur-[50px] rounded-full pointer-events-none"
							></div>

							<div class="pb-6 border-b border-aura-surface/50 md:border-b-0 md:pb-0 text-center md:text-left">
								<p class="text-xs text-aura-muted uppercase tracking-widest mb-2">
									Gain Annuel Estimé
								</p>
								<div
									class="text-5xl md:text-6xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-white to-aura-accent"
								>
									{formatCurrency(annualSaving())}
								</div>
							</div>

							<div class="text-center md:text-right space-y-3">
								<div
									class="inline-block bg-aura-surface/50 px-5 py-3 rounded-xl border border-aura-surface"
								>
									<span class="block text-3xl md:text-2xl font-bold text-white"
										>{formatNumber(annualHours())} h</span
									>
									<span class="text-xs text-aura-muted">regagnées / an</span>
								</div>
								<p class="text-sm md:text-xs text-aura-accent italic">
									Soit l'équivalent de <span class="font-bold text-white"
										>{fullTimeEquivalent()}</span
									> employés à temps plein "gagnés".
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<section class="py-14 md:py-24 max-w-7xl mx-auto px-6 scroll-mt-32" id="projects">
		<div class="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
			<div>
                <SectionTitle title="Réalisations" subtitle="Sélectionnées" align="left" />
				<p class="text-aura-muted max-w-md mt-[-3rem]">
					Des solutions sur mesure qui allient esthétisme et performance brute.
				</p>
			</div>
		</div>

			<div class="space-y-24">
            {#each projects as project, i}
                <!-- Project Card (Alternating Layout) -->
                <div class="block group">
                    <div class="grid md:grid-cols-2 gap-12 items-center reveal-on-scroll" use:reveal>

                        <!-- Image Column -->
                        <div class="{i % 2 !== 0 ? 'md:order-2' : ''}">
                            <a
                                href={`/projects/${project.slug}`}
                                class="block relative rounded-3xl overflow-hidden aspect-[4/3] border border-aura-surface"
                                aria-label={`Voir le projet ${project.title}`}
                            >
                                <enhanced:img
                                    src={projectImages[project.slug]}
                                    class="w-full h-full object-cover"
                                    alt={project.title}
                                    loading="lazy"
                                />
                                <div class="absolute inset-0 bg-black/20">
                                </div>
                            </a>
                        </div>

                        <!-- Text Column -->
                        <div class="space-y-6 {i % 2 !== 0 ? 'md:text-right md:order-1' : ''}">
                            <div class="flex flex-wrap gap-3 {i % 2 !== 0 ? 'md:justify-end' : ''}">
                                {#each project.tags as tag}
                                    <span
                                        class="px-3 py-1 rounded-full border border-aura-surface text-xs uppercase tracking-wider text-center whitespace-nowrap {tag === 'Refonte Totale' || tag === 'Cofondateur' ? 'text-aura-accent border-aura-accent/50' : 'text-aura-muted'}"
                                        >{tag}</span
                                    >
                                {/each}
                            </div>

                            <div>
                                <a href={`/projects/${project.slug}`} class="inline-block hover:text-aura-accent transition-colors">
                                    <h3 class="text-3xl font-serif mb-2 group-hover:text-aura-accent transition-colors duration-300">{project.title}</h3>
                                </a>
                                <p class="text-xs text-aura-muted">{project.subtitle}</p>
                            </div>

                            <p class="text-aura-muted leading-relaxed">
                                {project.description}
                            </p>

                            <!-- KPI Miniatures -->
                            <div class="grid grid-cols-2 gap-4 border-t border-aura-surface pt-6 {i % 2 !== 0 ? 'md:justify-items-end' : ''}">
                                {#each project.results.slice(0, 2) as result}
                                    <div>
                                        <span class="block text-2xl font-serif text-white">{result.value}</span>
                                        <span class="text-xs text-aura-muted">{result.label}</span>
                                    </div>
                                {/each}
                            </div>

                            <!-- Action Button -->
                            <div class="pt-2 {i % 2 !== 0 ? 'md:flex md:justify-end' : ''}">
                                <Button href={`/projects/${project.slug}`} variant="primary">
                                    Voir le projet
                                    <span class="material-symbols-outlined text-sm">arrow_forward</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            {/each}
		</div>
	</section>

	<!-- Parcours & Compétences -->
	<section class="py-16 md:py-24 max-w-7xl mx-auto px-6 scroll-mt-32" id="skills">
		<SectionTitle title="Parcours &" subtitle="Compétences" />

		<div class="grid md:grid-cols-2 gap-12 items-start">
			<!-- Formation -->
			<div class="space-y-8 reveal-on-scroll" use:reveal>
				<div class="flex items-start gap-4">
					<div
						class="flex-shrink-0 w-12 h-12 rounded-full bg-aura-accent/20 flex items-center justify-center"
					>
						<span class="material-symbols-outlined text-aura-accent">school</span>
					</div>
					<div>
						<h3 class="text-xl font-serif mb-2">Master Développeur & Manager de projet Web</h3>
						<p class="text-aura-muted text-sm leading-relaxed">
							Formation complète alliant expertise technique et management de projet. Une double
							compétence qui me permet de concevoir, développer et piloter des projets web de A à Z.
						</p>
					</div>
				</div>
				<div class="flex items-start gap-4">
					<div
						class="flex-shrink-0 w-12 h-12 rounded-full bg-aura-accent/10 flex items-center justify-center border border-aura-accent/20"
					>
						<span class="material-symbols-outlined text-aura-accent">code</span>
					</div>
					<div>
						<h3 class="text-xl font-serif mb-2">
							Bachelor Métiers du Multimédia et d'Internet
							<span class="text-aura-accent text-base font-normal"> - Option Développement Web</span>
						</h3>
						<p class="text-aura-muted text-sm leading-relaxed">
							Formation spécialisée en <span class="text-white">développement web</span> avec une approche
							polyvalente couvrant également le design et la communication numérique. Fondations
							solides pour une vision globale des projets digitaux.
						</p>
					</div>
				</div>
			</div>

			<!-- Compétences & Outils -->
			<div class="space-y-8 reveal-on-scroll" use:reveal={{ delay: 200 }}>
				<div>
					<h3 class="text-xl font-serif mb-6">Stack Technique</h3>
					<div class="space-y-4">
						<!-- Frontend & Frameworks -->
						<div>
							<p class="text-sm text-aura-muted mb-3 uppercase tracking-wider">Frontend & Frameworks</p>
							<div class="flex flex-wrap gap-2">
								<span
									class="px-3 py-1.5 rounded-full border border-aura-surface bg-aura-card text-sm text-aura-muted hover:border-aura-accent hover:text-white transition-colors flex items-center gap-2"
									><img
										src="https://cdn.simpleicons.org/nextdotjs/white"
										alt="Next.js"
										class="w-4 h-4"
									/>Next.js</span
								>
								<span
									class="px-3 py-1.5 rounded-full border border-aura-surface bg-aura-card text-sm text-aura-muted hover:border-aura-accent hover:text-white transition-colors flex items-center gap-2"
									><img
										src="https://cdn.simpleicons.org/react/white"
										alt="React"
										class="w-4 h-4"
									/>React</span
								>
								<span
									class="px-3 py-1.5 rounded-full border border-aura-surface bg-aura-card text-sm text-aura-muted hover:border-aura-accent hover:text-white transition-colors flex items-center gap-2"
									><img
										src="https://cdn.simpleicons.org/svelte/white"
										alt="Svelte"
										class="w-4 h-4"
									/>Svelte</span
								>
								<span
									class="px-3 py-1.5 rounded-full border border-aura-surface bg-aura-card text-sm text-aura-muted hover:border-aura-accent hover:text-white transition-colors flex items-center gap-2"
									><img
										src="https://cdn.simpleicons.org/typescript/white"
										alt="TypeScript"
										class="w-4 h-4"
									/>TypeScript</span
								>
								<span
									class="px-3 py-1.5 rounded-full border border-aura-surface bg-aura-card text-sm text-aura-muted hover:border-aura-accent hover:text-white transition-colors flex items-center gap-2"
									><img
										src="https://cdn.simpleicons.org/tailwindcss/white"
										alt="Tailwind"
										class="w-4 h-4"
									/>Tailwind</span
								>
							</div>
						</div>

						<!-- Backend & Base de données -->
						<div>
							<p class="text-sm text-aura-muted mb-3 uppercase tracking-wider">Backend & Base de données</p>
							<div class="flex flex-wrap gap-2">
								<span
									class="px-3 py-1.5 rounded-full border border-aura-surface bg-aura-card text-sm text-aura-muted hover:border-aura-accent hover:text-white transition-colors flex items-center gap-2"
									><img
										src="https://cdn.simpleicons.org/bun/white"
										alt="Bun"
										class="w-4 h-4"
									/>Bun</span
								>
								<span
									class="px-3 py-1.5 rounded-full border border-aura-surface bg-aura-card text-sm text-aura-muted hover:border-aura-accent hover:text-white transition-colors flex items-center gap-2"
									><img
										src="https://cdn.simpleicons.org/prisma/white"
										alt="Prisma"
										class="w-4 h-4"
									/>Prisma</span
								>
								<span
									class="px-3 py-1.5 rounded-full border border-aura-surface bg-aura-card text-sm text-aura-muted hover:border-aura-accent hover:text-white transition-colors flex items-center gap-2"
									><img
										src="https://cdn.simpleicons.org/postgresql/white"
										alt="PostgreSQL"
										class="w-4 h-4"
									/>PostgreSQL</span
								>
							</div>
						</div>

						<!-- Infrastructure & DevOps -->
						<div>
							<p class="text-sm text-aura-muted mb-3 uppercase tracking-wider">Infrastructure & DevOps</p>
							<div class="flex flex-wrap gap-2">
								<span
									class="px-3 py-1.5 rounded-full border border-aura-surface bg-aura-card text-sm text-aura-muted hover:border-aura-accent hover:text-white transition-colors flex items-center gap-2"
									><img
										src="https://cdn.simpleicons.org/docker/white"
										alt="Docker"
										class="w-4 h-4"
									/>Docker</span
								>
								<span
									class="px-3 py-1.5 rounded-full border border-aura-surface bg-aura-card text-sm text-aura-muted hover:border-aura-accent hover:text-white transition-colors flex items-center gap-2"
									><img
										src="https://cdn.simpleicons.org/coolify/white"
										alt="Coolify"
										class="w-4 h-4"
									/>Coolify</span
								>
								<span
									class="px-3 py-1.5 rounded-full border border-aura-surface bg-aura-card text-sm text-aura-muted hover:border-aura-accent hover:text-white transition-colors flex items-center gap-2"
									><img
										src="https://cdn.simpleicons.org/git/white"
										alt="Git"
										class="w-4 h-4"
									/>Git</span
								>
								<span
									class="px-3 py-1.5 rounded-full border border-aura-surface bg-aura-card text-sm text-aura-muted hover:border-aura-accent hover:text-white transition-colors flex items-center gap-2"
									><img
										src="https://cdn.simpleicons.org/hostinger/white"
										alt="Hostinger"
										class="w-4 h-4"
									/>Hostinger</span
								>
							</div>
						</div>

						<!-- IA & Automatisation -->
						<div>
							<p class="text-sm text-aura-muted mb-3 uppercase tracking-wider">IA & Automatisation</p>
							<div class="flex flex-wrap gap-2">
								<span
									class="px-3 py-1.5 rounded-full border border-aura-accent/30 bg-aura-card text-sm text-aura-accent hover:border-aura-accent hover:bg-aura-accent/10 transition-colors flex items-center gap-2"
									><img
										src="https://cdn.simpleicons.org/n8n/white"
										alt="N8N"
										class="w-4 h-4"
									/>N8N</span
								>
								<span
									class="px-3 py-1.5 rounded-full border border-aura-accent/30 bg-aura-card text-sm text-aura-accent hover:border-aura-accent hover:bg-aura-accent/10 transition-colors flex items-center gap-2"
									><img
										src="https://cdn.simpleicons.org/claude/white"
										alt="Claude"
										class="w-4 h-4"
									/>Claude Code</span
								>
								<span
									class="px-3 py-1.5 rounded-full border border-aura-accent/30 bg-aura-card text-sm text-aura-accent hover:border-aura-accent hover:bg-aura-accent/10 transition-colors flex items-center gap-2"
									><img
										src="https://cdn.simpleicons.org/googlegemini/white"
										alt="Gemini"
										class="w-4 h-4"
									/>Gemini</span
								>
								<span
									class="px-3 py-1.5 rounded-full border border-aura-accent/30 bg-aura-card text-sm text-aura-accent hover:border-aura-accent hover:bg-aura-accent/10 transition-colors flex items-center gap-2"
									><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>BMAD</span
								>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Testimonial -->
	<section class="py-16 md:py-24 bg-aura-card border-y border-aura-surface relative">
		<div class="max-w-4xl mx-auto px-6 text-center relative z-10 reveal-on-scroll" use:reveal>
			<span class="material-symbols-outlined text-6xl text-aura-accent mb-8 opacity-50"
				>format_quote</span
			>
			<blockquote class="text-2xl md:text-4xl font-serif leading-tight mb-10 text-white">
				"Eliott a repensé notre infrastructure e-commerce et nos outils internes. En seulement un an
				d'alternance, il a transformé notre dette technique en une infrastructure scalable et
				performante, <span class="text-aura-accent italic">posant les bases d'une croissance
					durable</span>."
			</blockquote>

			<div class="flex flex-col items-center justify-center gap-4">
				<enhanced:img
					src={jeromeDavy}
					class="w-16 h-16 rounded-full object-cover border-2 border-aura-accent p-1"
					alt="Jérôme DAVY"
					loading="lazy"
				/>
				<div>
					<div class="font-bold text-lg">Jérôme DAVY</div>
					<div class="text-sm text-aura-muted">PDG de MECA SERVICES</div>
				</div>
			</div>
		</div>
		<!-- Decoration -->
		<div class="absolute left-10 top-10 opacity-5 rotate-12">
			<span class="material-symbols-outlined text-[200px]">verified</span>
		</div>
	</section>
