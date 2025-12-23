<script lang="ts">
	import { onMount } from 'svelte';

	// Simulator state
	let employees = $state(10);
	let salary = $state(4000);
	let hours = $state(5);

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
	<title>Eliott B. - Développeur Freelance IA</title>
	<meta
		name="description"
		content="Transformez l'IA en levier de croissance. Développeur freelance senior spécialisé en intégration IA et automatisation."
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
				href="#top"
				class="text-xl font-serif font-semibold tracking-tight text-white flex items-center gap-3"
			>
				<img src="/logo.png" alt="Eliott B." class="w-8 h-8 object-contain" />
				Eliott B.
			</a>

			<div class="hidden md:flex items-center space-x-8 text-sm font-medium text-aura-muted">
				<a href="#expertise" class="hover:text-white transition-colors">Expertise</a>
				<a href="#simulator" class="hover:text-white transition-colors">Calculateur ROI</a>
				<a href="#projects" class="hover:text-white transition-colors">Projets</a>
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

	<!-- Hero Section -->
	<header
		id="top"
		class="relative min-h-screen pt-32 pb-20 flex flex-col justify-center overflow-hidden px-6"
	>
		<!-- Abstract Background Glows -->
		<div
			class="absolute top-0 right-0 w-[600px] h-[600px] bg-aura-accent/5 rounded-full blur-[120px] pointer-events-none"
		></div>
		<div
			class="absolute bottom-0 left-0 w-[400px] h-[400px] bg-aura-gold/5 rounded-full blur-[100px] pointer-events-none"
		></div>

		<div class="max-w-7xl mx-auto w-full grid lg:grid-cols-12 gap-16 items-center z-10">
			<!-- Left Content -->
			<div class="lg:col-span-7 space-y-10 animate-fade-up">
				<div
					class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-aura-surface bg-aura-card/50"
				>
					<span class="material-symbols-outlined text-[16px] text-aura-accent">verified</span>
					<span class="text-xs uppercase tracking-widest text-aura-muted"
						>Expert en transition IA</span
					>
				</div>

				<h1 class="text-5xl md:text-7xl font-serif leading-[1.05]">
					Transformez l'IA en <br />
					<span class="italic-accent">Levier de croissance</span>
				</h1>

				<p class="text-lg md:text-xl text-aura-muted font-light max-w-2xl leading-relaxed">
					Je transforme vos goulots d'étranglement en leviers de croissance. Une approche
					chirurgicale de la transition numérique pour un ROI mesurable dès le premier mois.
				</p>

				<div class="flex flex-col sm:flex-row gap-5 pt-4">
					<a
						href="#simulator"
						class="group relative px-8 py-4 bg-aura-accent text-aura-bg rounded-full font-medium overflow-hidden transition-all hover:scale-[1.02]"
					>
						<span class="relative z-10 flex items-center justify-center">
							Simuler mes gains
							<span
								class="material-symbols-outlined ml-2 text-sm transition-transform group-hover:translate-x-1"
								>payments</span
							>
						</span>
					</a>
					<a
						href="https://calendly.com"
						target="_blank"
						rel="noopener noreferrer"
						class="px-8 py-4 border border-aura-surface text-white rounded-full font-medium hover:bg-aura-surface transition-all flex items-center justify-center gap-2"
					>
						Prendre rendez-vous
						<span class="material-symbols-outlined text-sm">calendar_today</span>
					</a>
				</div>

				<!-- Social Proof Mini -->
				<div class="flex items-center gap-4 pt-6 border-t border-aura-surface/50">
					<div class="flex -space-x-3">
						<img
							src="/jerome-davy.png"
							class="w-10 h-10 rounded-full border-2 border-aura-bg object-cover"
							alt="Jérôme DAVY"
						/>
						<img
							src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces"
							class="w-10 h-10 rounded-full border-2 border-aura-bg object-cover"
							alt="Leader tech"
						/>
						<img
							src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces"
							class="w-10 h-10 rounded-full border-2 border-aura-bg object-cover"
							alt="Leader tech"
						/>
					</div>
					<div class="text-sm">
						<div class="flex text-aura-gold text-[12px]">
							<span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
							<span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
							<span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
							<span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
							<span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
						</div>
						<span class="text-aura-muted">Approuvé par +20 leaders tech</span>
					</div>
				</div>
			</div>

			<!-- Right Visual (Hero Image) -->
			<div class="lg:col-span-5 relative animate-fade-up delay-200">
				<div
					class="relative w-full aspect-[3/4] rounded-t-[100px] rounded-b-[30px] overflow-hidden border border-aura-surface"
				>
					<!-- Image Placeholder for Eliott -->
					<img
						src="/my-pic.png"
						alt="Eliott Bouquerel"
						class="w-full h-full object-cover"
					/>

					<!-- Floating Card -->
					<div
						class="absolute bottom-8 left-8 right-8 bg-aura-bg/80 backdrop-blur-xl border border-aura-surface p-5 rounded-2xl shadow-2xl"
					>
						<div class="flex justify-between items-start">
							<div>
								<p class="text-xs text-aura-accent uppercase tracking-wider mb-1">
									Dernière Mission
								</p>
								<p class="font-serif text-lg leading-tight">Optimisation Flux Logistique</p>
							</div>
							<span class="bg-aura-surface p-2 rounded-full text-aura-accent">
								<span class="material-symbols-outlined">trending_up</span>
							</span>
						</div>
						<div class="mt-3 flex items-center gap-2 text-sm text-aura-muted">
							<span class="flex items-center text-aura-accent"
								><span class="material-symbols-outlined text-[16px] mr-1">bolt</span> -40% coûts</span
							>
							<span class="w-1 h-1 rounded-full bg-aura-surface"></span>
							<span>IA Agent</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</header>

	<!-- Value Proposition -->
	<section class="py-24 max-w-7xl mx-auto px-6" id="expertise">
		<div class="text-center mb-16 animate-fade-up">
			<h2 class="text-4xl md:text-5xl font-serif mb-6">Expertise <span class="italic-accent">Premium</span></h2>
			<div class="w-24 h-1 bg-aura-accent mx-auto rounded-full opacity-50"></div>
		</div>

		<div class="grid md:grid-cols-3 gap-6">
			<!-- Card 1 -->
			<div
				class="aura-card bg-aura-card p-10 rounded-[32px] border border-aura-surface relative overflow-hidden group"
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
				class="aura-card bg-aura-card p-10 rounded-[32px] border border-aura-accent/30 relative overflow-hidden group shadow-[0_0_30px_rgba(111,240,211,0.05)]"
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
				class="aura-card bg-aura-card p-10 rounded-[32px] border border-aura-surface relative overflow-hidden group"
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
	<section class="py-24 bg-[#121E1C] relative overflow-hidden" id="simulator">
		<div class="max-w-6xl mx-auto px-6 relative z-10">
			<div class="grid lg:grid-cols-12 gap-12 items-center">
				<!-- Text Area -->
				<div class="lg:col-span-4">
					<span class="text-aura-accent text-sm font-semibold tracking-widest uppercase mb-2 block"
						>Projection Réelle</span
					>
					<h2 class="text-4xl font-serif mb-6">
						Combien vous coûte <br /> <span class="text-aura-muted italic">l'immobilisme ?</span>
					</h2>
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
				<div class="lg:col-span-8">
					<div
						class="bg-aura-card border border-aura-surface p-8 md:p-12 rounded-[40px] shadow-2xl backdrop-blur-sm"
					>
						<!-- Sliders Grid -->
						<div class="grid md:grid-cols-2 gap-x-12 gap-y-10 mb-12">
							<div class="space-y-4">
								<div class="flex justify-between items-baseline">
									<label class="text-sm font-medium text-aura-muted">Effectif concerné</label>
									<span class="text-2xl font-serif text-white">{employees}</span>
								</div>
								<div class="slider-wrapper" style="--progress: {(employees - 1) / (100 - 1) * 100}%">
									<input 
										type="range" 
										bind:value={employees} 
										min="1" 
										max="100" 
										step="1" 
										class="w-full"
									/>
								</div>
							</div>

							<div class="space-y-4">
								<div class="flex justify-between items-baseline">
									<label class="text-sm font-medium text-aura-muted">Salaire moyen charge /mois</label
									>
									<span class="text-2xl font-serif text-white">{salary} €</span>
								</div>
								<div class="slider-wrapper" style="--progress: {(salary - 2000) / (10000 - 2000) * 100}%">
									<input 
										type="range" 
										bind:value={salary} 
										min="2000" 
										max="10000" 
										step="100" 
										class="w-full"
									/>
								</div>
							</div>

							<div class="space-y-4 md:col-span-2">
								<div class="flex justify-between items-baseline">
									<label class="text-sm font-medium text-aura-muted"
										>Heures automatisables /semaine /pers</label
									>
									<span class="text-2xl font-serif text-white text-aura-accent">{hours} h</span>
								</div>
								<div class="slider-wrapper" style="--progress: {(hours - 1) / (20 - 1) * 100}%">
									<input 
										type="range" 
										bind:value={hours} 
										min="1" 
										max="20" 
										step="0.5" 
										class="w-full"
									/>
								</div>
								<p class="text-xs text-aura-muted mt-1">
									Saisie, reporting, tri d'emails, recherche documentaire...
								</p>
							</div>
						</div>

						<!-- Results Dashboard -->
						<div
							class="bg-[#0A110F] rounded-3xl p-8 border border-aura-surface/50 grid md:grid-cols-2 gap-8 items-center relative overflow-hidden"
						>
							<div
								class="absolute top-0 right-0 w-32 h-32 bg-aura-accent/10 blur-[50px] rounded-full pointer-events-none"
							></div>

							<div>
								<p class="text-xs text-aura-muted uppercase tracking-widest mb-1">
									Gain Annuel Estimé
								</p>
								<div
									class="text-5xl md:text-6xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-white to-aura-accent"
								>
									{formatCurrency(annualSaving())}
								</div>
							</div>

							<div class="md:text-right space-y-2">
								<div
									class="inline-block bg-aura-surface/50 px-4 py-2 rounded-xl border border-aura-surface"
								>
									<span class="block text-2xl font-bold text-white"
										>{formatNumber(annualHours())} h</span
									>
									<span class="text-xs text-aura-muted">regagnées / an</span>
								</div>
								<p class="text-xs text-aura-accent italic mt-2">
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

	<!-- Projects Gallery -->
	<section class="py-24 max-w-7xl mx-auto px-6" id="projects">
		<div class="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
			<div>
				<h2 class="text-4xl font-serif mb-4">
					Réalisations <span class="italic-accent">Sélectionnées</span>
				</h2>
				<p class="text-aura-muted max-w-md">
					Des solutions sur mesure qui allient esthétisme et performance brute.
				</p>
			</div>
			<a
				href="#"
				class="group flex items-center gap-2 text-aura-accent hover:text-white transition-colors"
			>
				Voir tout le portfolio
				<span class="material-symbols-outlined group-hover:translate-x-1 transition-transform"
					>arrow_forward</span
				>
			</a>
		</div>

		<div class="space-y-24">
			<!-- Project 1 (Left Aligned) -->
			<div class="grid md:grid-cols-2 gap-12 items-center group">
				<div
					class="relative rounded-3xl overflow-hidden aspect-[4/3] border border-aura-surface group-hover:border-aura-accent/50 transition-colors"
				>
					<img
						src="/mockup-mecaservices.png"
						class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
						alt="Dashboard e-commerce MECA SERVICES"
					/>
					<div class="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors">
					</div>
				</div>
				<div class="space-y-6">
					<div class="flex gap-3">
						<span
							class="px-3 py-1 rounded-full border border-aura-surface text-xs text-aura-muted uppercase tracking-wider"
							>Infrastructure e-commerce</span
						>
						<span
							class="px-3 py-1 rounded-full border border-aura-surface text-xs text-aura-accent uppercase tracking-wider"
							>Refonte Totale</span
						>
					</div>
					<h3 class="text-3xl font-serif">MECA SERVICES</h3>
					<p class="text-aura-muted leading-relaxed">
						Migration d'une boutique e-commerce vieillissante vers une solution moderne et évolutive.
						Transformation complète de l'expérience client et des outils de gestion avec une interface
						simplifiée et intuitive.
					</p>
					<div class="grid grid-cols-2 gap-4 border-t border-aura-surface pt-6">
						<div>
							<span class="block text-2xl font-serif text-white">-80%</span>
							<span class="text-xs text-aura-muted">Temps de gestion du site</span>
						</div>
						<div>
							<span class="block text-2xl font-serif text-white">x3</span>
							<span class="text-xs text-aura-muted">Satisfaction client</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Project 2 (Right Aligned) -->
			<div class="grid md:grid-cols-2 gap-12 items-center group">
				<div
					class="md:order-2 relative rounded-3xl overflow-hidden aspect-[4/3] border border-aura-surface group-hover:border-aura-accent/50 transition-colors"
				>
					<img
						src="/mockup-kpsull.png"
						class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
						alt="KPSULL Marketplace"
					/>
				</div>
				<div class="md:order-1 space-y-6 md:text-right">
					<div class="flex gap-3 md:justify-end">
						<span
							class="px-3 py-1 rounded-full border border-aura-surface text-xs text-aura-muted uppercase tracking-wider"
							>Marketplace</span
						>
						<span
							class="px-3 py-1 rounded-full border border-aura-surface text-xs text-aura-accent uppercase tracking-wider"
							>Cofondateur</span
						>
					</div>
					<h3 class="text-3xl font-serif">KPSULL</h3>
					<p class="text-aura-muted leading-relaxed">
						Création d'une marketplace dédiée aux créateurs de mode pour simplifier la mise en vente
						de leurs pièces. Plateforme complète permettant aux créateurs de gérer leurs collections,
						leurs ventes et leur visibilité en ligne.
					</p>
					<div class="grid grid-cols-2 gap-4 border-t border-aura-surface pt-6 md:justify-items-end">
						<div>
							<span class="block text-2xl font-serif text-white">100%</span>
							<span class="text-xs text-aura-muted">Autonome</span>
						</div>
						<div>
							<span class="block text-2xl font-serif text-white">0</span>
							<span class="text-xs text-aura-muted">Frais cachés</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Parcours & Compétences -->
	<section class="py-24 max-w-7xl mx-auto px-6" id="skills">
		<div class="text-center mb-16 animate-fade-up">
			<h2 class="text-4xl md:text-5xl font-serif mb-6">
				Parcours & <span class="italic-accent">Compétences</span>
			</h2>
			<div class="w-24 h-1 bg-aura-accent mx-auto rounded-full opacity-50"></div>
		</div>

		<div class="grid md:grid-cols-2 gap-12 items-start">
			<!-- Formation -->
			<div class="space-y-8">
				<div class="flex items-start gap-4">
					<div
						class="flex-shrink-0 w-12 h-12 rounded-full bg-aura-accent/20 flex items-center justify-center"
					>
						<span class="material-symbols-outlined text-aura-accent">school</span>
					</div>
					<div>
						<h3 class="text-xl font-serif mb-2">Master Développeur & Chef de Projet Web</h3>
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
			<div class="space-y-8">
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
										src="https://cdn.simpleicons.org/anthropic/white"
										alt="Claude Code"
										class="w-4 h-4"
									/>Claude Code</span
								>
								<span
									class="px-3 py-1.5 rounded-full border border-aura-accent/30 bg-aura-card text-sm text-aura-accent hover:border-aura-accent hover:bg-aura-accent/10 transition-colors flex items-center gap-2"
									><img
										src="https://cdn.simpleicons.org/google/white"
										alt="Gemini"
										class="w-4 h-4"
									/>Gemini</span
								>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Testimonial -->
	<section class="py-24 bg-aura-card border-y border-aura-surface relative">
		<div class="max-w-4xl mx-auto px-6 text-center relative z-10">
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
				<img
					src="/jerome-davy.png"
					class="w-16 h-16 rounded-full object-cover border-2 border-aura-accent p-1"
					alt="Jérôme DAVY"
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

	<!-- CTA / Contact -->
	<footer class="py-24 relative overflow-hidden text-center">
		<div class="absolute inset-0 bg-gradient-to-b from-aura-bg to-[#080d0c]"></div>
		<div class="max-w-3xl mx-auto px-6 relative z-10 space-y-8">
			<h2 class="text-5xl md:text-6xl font-serif">
				Votre transformation <br />commence <span class="italic-accent">ici</span>.
			</h2>
			<p class="text-aura-muted text-lg">
				Je limite mon accompagnement à 2 entreprises par trimestre pour garantir un niveau
				d'excellence absolu. Vérifions si nous sommes compatibles.
			</p>
			<div class="flex flex-col sm:flex-row justify-center gap-4 pt-4">
				<a
					href="https://calendly.com"
					target="_blank"
					rel="noopener noreferrer"
					class="px-10 py-5 bg-aura-accent text-aura-bg rounded-full font-bold text-lg hover:bg-white transition-all transform hover:scale-105 shadow-[0_0_40px_rgba(111,240,211,0.3)]"
				>
					Réserver un audit gratuit
				</a>
				<a
					href="mailto:hello@eliott.com"
					class="px-10 py-5 border border-aura-surface text-white rounded-full font-medium hover:bg-aura-surface transition-all"
				>
					Me contacter par email
				</a>
			</div>

			<div
				class="pt-20 text-xs text-aura-muted flex flex-col md:flex-row justify-center gap-8"
			>
				<span>&copy; 2025 Eliott Bouquerel</span>
				<a href="/mentions-legales" class="hover:text-white transition-colors">Mentions Légales</a>
				<a href="/cgv" class="hover:text-white transition-colors">CGV</a>
			</div>
		</div>
	</footer>
</div>
