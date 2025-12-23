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

<svelte:head>
	<title>Eliott B. - Developpeur Freelance IA</title>
	<meta
		name="description"
		content="Transformez l'IA en levier de croissance. Developpeur freelance senior specialise en integration IA et automatisation."
	/>
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
				class="text-xl font-serif font-semibold tracking-tight text-white flex items-center gap-2"
			>
				<span class="w-2 h-2 rounded-full bg-aura-accent"></span>
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
						>Developpeur Freelance Senior</span
					>
				</div>

				<h1 class="text-5xl md:text-7xl font-serif leading-[1.05]">
					Transformez l'IA en <br />
					<span class="italic-accent">Levier de croissance</span>
				</h1>

				<p class="text-lg md:text-xl text-aura-muted font-light max-w-2xl leading-relaxed">
					Je transforme vos goulots d'etranglement en leviers de croissance. Une approche
					chirurgicale de la transition numerique pour un ROI mesurable des le premier mois.
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
								>calculate</span
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
							src="https://lh3.googleusercontent.com/gg-dl/ABS2GSk66asWewYGhkoljKdirGzBf6FJIaKDk4PRaUACxsKd6oHohj2ydY_xNUHIVIidra9J84m83v8xHL_VQQfwnRASlF87FufNQlcX3tricveNoqhfGa9s9bE7_BV1Q1a-9kybb3cFk7wKIz1deV456VLbz5L7kPBWYv5jhHyACPCs6Kzq"
							class="w-10 h-10 rounded-full border-2 border-aura-bg object-cover"
							alt="Client"
						/>
						<img
							src="https://lh3.googleusercontent.com/gg-dl/ABS2GSlaeH6j2egQ0H33RLQnVyr1t-M_O_0ufM3tgHHOgnF1v4rdZwJc_7Q1Jpmj6YUxqrvH_1UafhLHor68xWl4vmWirre1jjSyC9TGPhl2QPuVLlcPJCeBKyA4ZJ4OF2M5sp3-R20d2SCNgE52RDoTlnTPhwM5jTVZDfuhcFSsAlTHmenW"
							class="w-10 h-10 rounded-full border-2 border-aura-bg object-cover"
							alt="Client"
						/>
						<img
							src="https://lh3.googleusercontent.com/gg-dl/ABS2GSlgt80jQv784n6rhkPx6jsTFkYAc84wv556IO3NY3n75DQl8XAqpWwO6HbmiyO1R1dM3yk502jDk6aiC44Nayu8ZvOhYMrOGHVKqn2YdJ45YM7fSGmY0_kccjjaTucOnfFGgTtb_GGxEU8Y_NZjcgDYx_54G7Aw2av1f7GeBqseB0-2"
							class="w-10 h-10 rounded-full border-2 border-aura-bg object-cover"
							alt="Client"
						/>
					</div>
					<div class="text-sm">
						<div class="flex text-aura-gold text-[12px]">
							<span class="material-symbols-outlined text-[16px] fill-current">star</span>
							<span class="material-symbols-outlined text-[16px] fill-current">star</span>
							<span class="material-symbols-outlined text-[16px] fill-current">star</span>
							<span class="material-symbols-outlined text-[16px] fill-current">star</span>
							<span class="material-symbols-outlined text-[16px] fill-current">star</span>
						</div>
						<span class="text-aura-muted">Approuve par +20 leaders tech</span>
					</div>
				</div>
			</div>

			<!-- Right Visual (Hero Image) -->
			<div class="lg:col-span-5 relative animate-fade-up delay-200">
				<div
					class="relative w-full aspect-[3/4] rounded-t-[100px] rounded-b-[30px] overflow-hidden border border-aura-surface group"
				>
					<!-- Image Placeholder for Eliott -->
					<img
						src="/my-pic.png"
						alt="Eliott Bouquerel"
						class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
					/>

					<!-- Floating Card -->
					<div
						class="absolute bottom-8 left-8 right-8 bg-aura-bg/80 backdrop-blur-xl border border-aura-surface p-5 rounded-2xl shadow-2xl"
					>
						<div class="flex justify-between items-start">
							<div>
								<p class="text-xs text-aura-accent uppercase tracking-wider mb-1">
									Derniere Mission
								</p>
								<p class="font-serif text-lg leading-tight">Optimisation Flux Logistique</p>
							</div>
							<span class="bg-aura-surface p-2 rounded-full text-aura-accent">
								<span class="material-symbols-outlined">trending_up</span>
							</span>
						</div>
						<div class="mt-3 flex items-center gap-2 text-sm text-aura-muted">
							<span class="flex items-center text-aura-accent"
								><span class="material-symbols-outlined text-[16px] mr-1">bolt</span> -40% couts</span
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
					class="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity"
				>
					<span class="material-symbols-outlined text-8xl">architecture</span>
				</div>
				<h3 class="text-2xl font-serif mb-4">Architecture & Refonte</h3>
				<p class="text-aura-muted leading-relaxed mb-8">
					Je ne fais pas que coder, je repense la structure meme de vos outils. Obsede par la
					performance et la scalabilite de votre infrastructure.
				</p>
				<ul class="space-y-3 text-sm text-aura-muted border-t border-aura-surface pt-6">
					<li class="flex items-center gap-2">
						<span class="w-1.5 h-1.5 rounded-full bg-aura-accent"></span>Modernisation Legacy
					</li>
					<li class="flex items-center gap-2">
						<span class="w-1.5 h-1.5 rounded-full bg-aura-accent"></span>Micro-services
					</li>
				</ul>
			</div>

			<!-- Card 2 -->
			<div
				class="aura-card bg-aura-card p-10 rounded-[32px] border border-aura-accent/30 relative overflow-hidden group shadow-[0_0_30px_rgba(111,240,211,0.05)]"
			>
				<div
					class="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity"
				>
					<span class="material-symbols-outlined text-8xl text-aura-accent">psychology</span>
				</div>
				<h3 class="text-2xl font-serif mb-4 text-white">Integration IA</h3>
				<p class="text-aura-muted leading-relaxed mb-8">
					Le coeur de mon offre. Deploiement d'agents autonomes qui travaillent pour vous pendant
					que vous dormez. Support, analyse, redaction.
				</p>
				<ul class="space-y-3 text-sm text-aura-muted border-t border-aura-surface pt-6">
					<li class="flex items-center gap-2">
						<span class="w-1.5 h-1.5 rounded-full bg-aura-accent"></span>Agents GPT-4 Custom
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
					class="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity"
				>
					<span class="material-symbols-outlined text-8xl">speed</span>
				</div>
				<h3 class="text-2xl font-serif mb-4">Audit de Productivite</h3>
				<p class="text-aura-muted leading-relaxed mb-8">
					Avant toute ligne de code, une analyse profonde de vos processus. J'identifie ou vous
					perdez de l'argent et comment le recuperer.
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
						>Projection Reelle</span
					>
					<h2 class="text-4xl font-serif mb-6">
						Combien vous coute <br /> <span class="text-aura-muted italic">l'immobilisme ?</span>
					</h2>
					<p class="text-aura-muted mb-8 text-sm leading-relaxed">
						Ce simulateur n'est pas un gadget. Il se base sur les metriques moyennes observees chez
						mes clients post-transition IA. Visualisez le capital que vous pourriez reinvestir.
					</p>

					<!-- Presets -->
					<div class="space-y-3">
						<p class="text-xs text-aura-muted uppercase tracking-wider">Scenarios types :</p>
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
									<label class="text-sm font-medium text-aura-muted">Effectif concerne</label>
									<span class="text-2xl font-serif text-white">{employees}</span>
								</div>
								<input type="range" bind:value={employees} min="1" max="100" step="1" />
							</div>

							<div class="space-y-4">
								<div class="flex justify-between items-baseline">
									<label class="text-sm font-medium text-aura-muted">Salaire moyen charge /mois</label
									>
									<span class="text-2xl font-serif text-white">{salary} EUR</span>
								</div>
								<input type="range" bind:value={salary} min="2000" max="10000" step="100" />
							</div>

							<div class="space-y-4 md:col-span-2">
								<div class="flex justify-between items-baseline">
									<label class="text-sm font-medium text-aura-muted"
										>Heures automatisables /semaine /pers</label
									>
									<span class="text-2xl font-serif text-white text-aura-accent">{hours} h</span>
								</div>
								<input type="range" bind:value={hours} min="1" max="20" step="0.5" />
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
									Gain Annuel Estime
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
									<span class="text-xs text-aura-muted">regagnees / an</span>
								</div>
								<p class="text-xs text-aura-accent italic mt-2">
									Soit l'equivalent de <span class="font-bold text-white"
										>{fullTimeEquivalent()}</span
									> employes a temps plein "gagnes".
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
					Realisations <span class="italic-accent">Selectionnees</span>
				</h2>
				<p class="text-aura-muted max-w-md">
					Des solutions sur mesure qui allient esthetisme et performance brute.
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
						src="https://lh3.googleusercontent.com/gg-dl/ABS2GSl0-lD_LC_59y__kC-r75MMrYSaLlrA1VE11cnBJWnBZoNuY-dLOZI4lcYRkdja5O1GLAwo6gTFo6-5ZOihsyr8KDXKWElM7DWWNmgRKCk4oBL7Yz3GLPn0v0PNuYB9RYSke_McaUzkcZEEyJ9AtQzJMX_A-q9_uhYY0Du39bp5HBVW"
						class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
						alt="E-commerce"
					/>
					<div class="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors">
					</div>
				</div>
				<div class="space-y-6">
					<div class="flex gap-3">
						<span
							class="px-3 py-1 rounded-full border border-aura-surface text-xs text-aura-muted uppercase tracking-wider"
							>E-commerce</span
						>
						<span
							class="px-3 py-1 rounded-full border border-aura-surface text-xs text-aura-accent uppercase tracking-wider"
							>Refonte Totale</span
						>
					</div>
					<h3 class="text-3xl font-serif">Maison Lumiere</h3>
					<p class="text-aura-muted leading-relaxed">
						Transformation complete d'une infrastructure Magento vieillissante vers une stack
						Headless (Shopify Plus + React). Integration d'un moteur de recommandation par IA qui a
						augmente le panier moyen de 15%.
					</p>
					<div class="grid grid-cols-2 gap-4 border-t border-aura-surface pt-6">
						<div>
							<span class="block text-2xl font-serif text-white">-60%</span>
							<span class="text-xs text-aura-muted">Temps de chargement</span>
						</div>
						<div>
							<span class="block text-2xl font-serif text-white">+22%</span>
							<span class="text-xs text-aura-muted">Taux de conversion</span>
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
						src="https://lh3.googleusercontent.com/gg-dl/ABS2GSlbGUI2OKaoU2uUHcAJulFz1YwVdrMzcNmyXBUaLJcPT_2D1q9_zUfOthxnDbjWcRGuVonjZKgY5wtpf3EJbuA0bEFu2ZFSkO2CeHwooeZx2AjhfD8bPnuznSPGMSzHiuJMsLO7mP1jUBhetJJpE_F9WLzeSczMSUPm5ChdESWVrnI"
						class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
						alt="SaaS Logistics"
					/>
				</div>
				<div class="md:order-1 space-y-6 md:text-right">
					<div class="flex gap-3 md:justify-end">
						<span
							class="px-3 py-1 rounded-full border border-aura-surface text-xs text-aura-muted uppercase tracking-wider"
							>SaaS B2B</span
						>
						<span
							class="px-3 py-1 rounded-full border border-aura-surface text-xs text-aura-accent uppercase tracking-wider"
							>Automatisation</span
						>
					</div>
					<h3 class="text-3xl font-serif">LogiFlux AI</h3>
					<p class="text-aura-muted leading-relaxed">
						Creation d'un middleware intelligent connectant ERP, CRM et transporteurs. L'IA analyse
						les commandes entrantes et route automatiquement vers le transporteur le plus economique
						et rapide.
					</p>
					<div class="grid grid-cols-2 gap-4 border-t border-aura-surface pt-6 md:justify-items-end">
						<div>
							<span class="block text-2xl font-serif text-white">40h</span>
							<span class="text-xs text-aura-muted">Economisees / semaine</span>
						</div>
						<div>
							<span class="block text-2xl font-serif text-white">0%</span>
							<span class="text-xs text-aura-muted">Erreur de saisie</span>
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
				"Ce n'etait pas juste une refonte technique, c'etait une refonte business. L'automatisation
				mise en place par Eliott gere aujourd'hui <span class="text-aura-accent italic"
					>80% de notre flux administratif</span
				>. C'est le meilleur investissement de l'annee."
			</blockquote>

			<div class="flex flex-col items-center justify-center gap-4">
				<img
					src="https://lh3.googleusercontent.com/gg-dl/ABS2GSmZKGm0S0JDQS6A600_49m_zq3772NSVQ5OCPAVSRYsQG4gjQ3TBrqlIHpMr2pyQsaVtcSU7uVJJhMWpeOG2KNaL3lg_TpQJlWH0rKeRsbMDu1o1F4JSwmMmSVKtAVnsnij_Bf5mqGDI_uWfgfvGx2xkAbJYdBO37YhsFWHgMJaSMPH"
					class="w-16 h-16 rounded-full object-cover border-2 border-aura-accent p-1"
					alt="CEO"
				/>
				<div>
					<div class="font-bold text-lg">Marc D.</div>
					<div class="text-sm text-aura-muted">PDG, Groupe Retail France</div>
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
				Je limite mon accompagnement a 2 entreprises par trimestre pour garantir un niveau
				d'excellence absolu. Verifions si nous sommes compatibles.
			</p>
			<div class="flex flex-col sm:flex-row justify-center gap-4 pt-4">
				<a
					href="https://calendly.com"
					target="_blank"
					rel="noopener noreferrer"
					class="px-10 py-5 bg-aura-accent text-aura-bg rounded-full font-bold text-lg hover:bg-white transition-all transform hover:scale-105 shadow-[0_0_40px_rgba(111,240,211,0.3)]"
				>
					Reserver un audit gratuit
				</a>
				<a
					href="mailto:hello@eliott.com"
					class="px-10 py-5 border border-aura-surface text-white rounded-full font-medium hover:bg-aura-surface transition-all"
				>
					Me contacter par email
				</a>
			</div>

			<div
				class="pt-20 text-xs text-aura-surface flex flex-col md:flex-row justify-center gap-8 opacity-50"
			>
				<span>&copy; 2025 Eliott Bouquerel</span>
				<a href="#" class="hover:text-white">Mentions Legales</a>
				<a href="#" class="hover:text-white">CGV</a>
			</div>
		</div>
	</footer>
</div>
