import type { Metadata } from 'next';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { RevealOnScroll } from '@/components/animation/RevealOnScroll';
import { RevealImage } from '@/components/animation/RevealImage';
import { FooterConfigurator } from '@/components/layout/FooterConfigurator';

const SITE_URL = 'https://eliottbouquerel.fr';
const url = `${SITE_URL}/projects/kpsull`;
const pageTitle = 'KPSULL - Marketplace Mode & Créateurs | Eliott B.';
const pageDescription =
	'KPSULL : marketplace pour créateurs de mode indépendants. +50% de temps créatif récupéré, x3 taux de conversion, mise en ligne en moins de 5 minutes.';

export const metadata: Metadata = {
	title: pageTitle,
	description: pageDescription,
	alternates: { canonical: url },
	openGraph: {
		title: 'KPSULL - Marketplace Mode & Créateurs',
		description:
			"Les créateurs perdent 50% de leur temps à vendre. KPSULL centralise vitrine, paiements et gestion pour qu'ils se concentrent sur leur métier.",
		url,
		type: 'article',
		images: [{ url: `${SITE_URL}/images/mockup-kpsull.png` }]
	},
	twitter: {
		card: 'summary_large_image',
		title: 'KPSULL - Marketplace Mode & Créateurs',
		description:
			"Les créateurs perdent 50% de leur temps à vendre. KPSULL centralise vitrine, paiements et gestion pour qu'ils se concentrent sur leur métier.",
		images: [`${SITE_URL}/images/mockup-kpsull.png`]
	}
};

export default function KpsullPage() {
	return (
		<>
			<FooterConfigurator
				config={{
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
				}}
			/>

			{/* Hero Section */}
			<header className="relative min-h-[70vh] pt-24 pb-16 md:pt-32 md:pb-24 flex flex-col justify-center px-6">
				{/* Background Glows */}
				<div className="absolute top-0 right-0 w-[500px] h-[500px] bg-aura-accent/5 rounded-full blur-[120px] pointer-events-none" />
				<div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-aura-gold/5 rounded-full blur-[100px] pointer-events-none" />

				<div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-16 items-center z-10">
					{/* Content */}
					<RevealOnScroll className="space-y-6">
						{/* Back link */}
						<div>
							<a
								href="/#projects"
								className="inline-flex items-center gap-2 text-sm text-aura-muted hover:text-aura-accent transition-colors"
							>
								<span className="material-symbols-outlined text-[16px]">arrow_back</span>
								Retour aux projets
							</a>
						</div>

						{/* Tags */}
						<div className="flex flex-wrap gap-3">
							<span className="px-3 py-1 rounded-full border border-aura-accent/50 text-xs text-aura-accent uppercase tracking-wider">
								Cofondateur
							</span>
							<span className="px-3 py-1 rounded-full border border-aura-surface text-xs text-aura-muted uppercase tracking-wider">
								Marketplace
							</span>
						</div>

						<h1 className="text-4xl md:text-6xl font-serif leading-[1.1]">
							<span className="text-aura-accent">KPSULL</span>
						</h1>

						<p className="text-xl md:text-2xl text-aura-muted font-light leading-relaxed">
							Les créateurs perdent 50% de leur temps à vendre. KPSULL centralise vitrine,
							paiements et gestion pour qu&apos;ils se concentrent sur leur métier.
						</p>

						{/* Key Metrics */}
						<div className="grid grid-cols-2 gap-6 pt-6 border-t border-aura-surface">
							<div>
								<span className="block text-2xl md:text-3xl font-serif text-aura-accent">
									+50%
								</span>
								<span className="text-xs text-aura-muted">Temps créatif récupéré</span>
							</div>
							<div>
								<span className="block text-2xl md:text-3xl font-serif text-white">x3</span>
								<span className="text-xs text-aura-muted">Taux de conversion</span>
							</div>
						</div>
					</RevealOnScroll>

					{/* Hero Image */}
					<RevealOnScroll className="relative" delay={200}>
						<div className="relative rounded-3xl overflow-hidden border border-aura-surface shadow-2xl">
							<RevealImage
								src="/images/mockup-kpsull.png"
								alt="KPSULL Marketplace"
								width={1200}
								height={900}
								className="w-full h-auto"
								priority
								sizes="(max-width: 1024px) 100vw, 50vw"
							/>
						</div>
					</RevealOnScroll>
				</div>
			</header>

			{/* Section Le Constat */}
			<section className="py-16 md:py-24 px-6">
				<div className="max-w-7xl mx-auto">
					<SectionTitle title="Le" subtitle="Constat" align="left" />

					<div className="grid lg:grid-cols-2 gap-12 lg:gap-16 mt-12">
						{/* Texte narratif */}
						<RevealOnScroll className="space-y-8">
							<div className="space-y-4">
								<div className="flex items-center gap-3">
									<span className="material-symbols-outlined text-aura-accent">palette</span>
									<span className="text-sm text-aura-accent uppercase tracking-wider">
										Côté Créateur
									</span>
								</div>
								<p className="text-lg text-aura-text leading-relaxed italic">
									&quot;Je passe mes week-ends à concevoir des vêtements dans mon atelier. Mes
									créations sont uniques… mais{' '}
									<span className="text-aura-accent">invisibles</span>.&quot;
								</p>
							</div>

							<div className="space-y-4">
								<div className="flex items-center gap-3">
									<span className="material-symbols-outlined text-aura-gold">shopping_bag</span>
									<span className="text-sm text-aura-gold uppercase tracking-wider">
										Côté Acheteur
									</span>
								</div>
								<p className="text-lg text-aura-text leading-relaxed italic">
									&quot;Je scrolle depuis deux heures. Je cherche une pièce qui me ressemble, pas
									un énième produit de{' '}
									<span className="text-aura-gold">fast-fashion</span>.&quot;
								</p>
							</div>

							<p className="text-2xl font-serif text-white pt-4 border-t border-aura-surface">
								On ne se connaît pas. <span className="text-aura-accent italic">On devrait.</span>
							</p>
						</RevealOnScroll>

						{/* Card Frustrations */}
						<RevealOnScroll
							className="bg-aura-card rounded-3xl p-8 border border-aura-surface"
							delay={150}
						>
							<h3 className="text-xl font-serif mb-6">Les frustrations</h3>

							<div className="grid grid-cols-2 gap-6">
								<div className="space-y-4">
									<div className="flex items-center gap-2 text-aura-accent">
										<span className="material-symbols-outlined text-[20px]">palette</span>
										<span className="text-sm font-medium">Créateurs</span>
									</div>
									<ul className="space-y-3 text-sm text-aura-muted">
										<li className="flex items-start gap-2">
											<span className="text-red-400 mt-1">×</span>
											Visibilité difficile
										</li>
										<li className="flex items-start gap-2">
											<span className="text-red-400 mt-1">×</span>
											Jongler entre canaux
										</li>
										<li className="flex items-start gap-2">
											<span className="text-red-400 mt-1">×</span>
											Efforts sans retour
										</li>
										<li className="flex items-start gap-2">
											<span className="text-red-400 mt-1">×</span>
											Audience cachée
										</li>
									</ul>
								</div>

								<div className="space-y-4">
									<div className="flex items-center gap-2 text-aura-gold">
										<span className="material-symbols-outlined text-[20px]">shopping_bag</span>
										<span className="text-sm font-medium">Acheteurs</span>
									</div>
									<ul className="space-y-3 text-sm text-aura-muted">
										<li className="flex items-start gap-2">
											<span className="text-red-400 mt-1">×</span>
											Trop de plateformes
										</li>
										<li className="flex items-start gap-2">
											<span className="text-red-400 mt-1">×</span>
											Fast-fashion dominant
										</li>
										<li className="flex items-start gap-2">
											<span className="text-red-400 mt-1">×</span>
											Mauvaises surprises
										</li>
										<li className="flex items-start gap-2">
											<span className="text-red-400 mt-1">×</span>
											Manque de sens
										</li>
									</ul>
								</div>
							</div>
						</RevealOnScroll>
					</div>
				</div>
			</section>

			{/* Section Problématique */}
			<section className="py-16 md:py-24 px-6">
				<div className="max-w-4xl mx-auto">
					<RevealOnScroll className="bg-aura-card rounded-3xl p-8 md:p-12 border border-aura-surface text-center">
						<blockquote className="text-xl md:text-2xl font-serif leading-relaxed">
							&quot;Deux frustrations. Un même vide au milieu. Comment créer le pont entre des
							créateurs <span className="text-aura-accent italic">talentueux mais invisibles</span>{' '}
							et des acheteurs{' '}
							<span className="text-aura-gold italic">en quête d&apos;authenticité</span> ?&quot;
						</blockquote>
					</RevealOnScroll>
				</div>
			</section>

			{/* Section La Solution */}
			<section className="py-16 md:py-24 px-6">
				<div className="max-w-7xl mx-auto">
					<SectionTitle title="La Solution" subtitle="KPSULL" />

					<div className="grid md:grid-cols-2 gap-12 lg:gap-16 mt-12">
						{/* Pour les Créateurs */}
						<RevealOnScroll className="bg-aura-card rounded-3xl p-8 border border-aura-surface">
							<div className="flex items-center gap-3 mb-6">
								<div className="w-12 h-12 rounded-full bg-aura-accent/10 flex items-center justify-center">
									<span className="material-symbols-outlined text-aura-accent">palette</span>
								</div>
								<h3 className="text-xl font-serif">Pour les Créateurs</h3>
							</div>

							<ul className="space-y-4">
								<li className="flex items-start gap-3">
									<span className="text-aura-accent mt-1">
										<span className="material-symbols-outlined text-[18px]">check_circle</span>
									</span>
									<span className="text-aura-muted">
										Une <span className="text-white">vitrine</span> qui met en valeur leur travail
									</span>
								</li>
								<li className="flex items-start gap-3">
									<span className="text-aura-accent mt-1">
										<span className="material-symbols-outlined text-[18px]">check_circle</span>
									</span>
									<span className="text-aura-muted">
										Des <span className="text-white">outils</span> pour se professionnaliser
									</span>
								</li>
								<li className="flex items-start gap-3">
									<span className="text-aura-accent mt-1">
										<span className="material-symbols-outlined text-[18px]">check_circle</span>
									</span>
									<span className="text-aura-muted">
										Une <span className="text-white">communauté</span> d&apos;acheteurs qualifiés
									</span>
								</li>
								<li className="flex items-start gap-3">
									<span className="text-aura-accent mt-1">
										<span className="material-symbols-outlined text-[18px]">check_circle</span>
									</span>
									<span className="text-aura-muted">
										Moins de temps à se vendre, <span className="text-white">plus à créer</span>
									</span>
								</li>
							</ul>
						</RevealOnScroll>

						{/* Pour les Acheteurs */}
						<RevealOnScroll
							className="bg-aura-card rounded-3xl p-8 border border-aura-surface"
							delay={150}
						>
							<div className="flex items-center gap-3 mb-6">
								<div className="w-12 h-12 rounded-full bg-aura-gold/10 flex items-center justify-center">
									<span className="material-symbols-outlined text-aura-gold">shopping_bag</span>
								</div>
								<h3 className="text-xl font-serif">Pour les Acheteurs</h3>
							</div>

							<ul className="space-y-4">
								<li className="flex items-start gap-3">
									<span className="text-aura-gold mt-1">
										<span className="material-symbols-outlined text-[18px]">check_circle</span>
									</span>
									<span className="text-aura-muted">
										Découvrir des pièces <span className="text-white">authentiques</span>
									</span>
								</li>
								<li className="flex items-start gap-3">
									<span className="text-aura-gold mt-1">
										<span className="material-symbols-outlined text-[18px]">check_circle</span>
									</span>
									<span className="text-aura-muted">
										Savoir <span className="text-white">qui les a créées</span>
									</span>
								</li>
								<li className="flex items-start gap-3">
									<span className="text-aura-gold mt-1">
										<span className="material-symbols-outlined text-[18px]">check_circle</span>
									</span>
									<span className="text-aura-muted">
										Acheter en <span className="text-white">confiance</span>
									</span>
								</li>
								<li className="flex items-start gap-3">
									<span className="text-aura-gold mt-1">
										<span className="material-symbols-outlined text-[18px]">check_circle</span>
									</span>
									<span className="text-aura-muted">
										Soutenir <span className="text-white">directement</span> un savoir-faire
									</span>
								</li>
							</ul>
						</RevealOnScroll>
					</div>
				</div>
			</section>

			{/* Section Business Model */}
			<section className="py-16 md:py-24 px-6 bg-aura-card">
				<div className="max-w-7xl mx-auto">
					<SectionTitle title="Business" subtitle="Model" />

					<div className="grid lg:grid-cols-2 gap-12 lg:gap-16 mt-12">
						{/* Freemium */}
						<RevealOnScroll className="space-y-6">
							<div className="flex items-center gap-3">
								<div className="w-12 h-12 rounded-full bg-aura-accent/10 flex items-center justify-center">
									<span className="material-symbols-outlined text-aura-accent">card_giftcard</span>
								</div>
								<h3 className="text-xl font-serif">Modèle Freemium</h3>
							</div>

							<p className="text-aura-muted leading-relaxed">
								Les créateurs démarrent <span className="text-white">gratuitement</span> sur KPSULL.
								Ils peuvent tester la plateforme sans engagement, publier leurs premières créations
								et réaliser leurs premières ventes.
							</p>

							<div className="bg-aura-bg/50 rounded-2xl p-6 border border-aura-surface">
								<h4 className="text-sm text-aura-accent uppercase tracking-wider mb-4">
									Seuils de passage Premium
								</h4>
								<div className="grid grid-cols-2 gap-4">
									<div className="text-center p-4 bg-aura-surface/30 rounded-xl">
										<span className="block text-2xl font-serif text-white mb-1">5</span>
										<span className="text-xs text-aura-muted">articles publiés</span>
									</div>
									<div className="text-center p-4 bg-aura-surface/30 rounded-xl">
										<span className="block text-2xl font-serif text-white mb-1">10</span>
										<span className="text-xs text-aura-muted">ventes totales</span>
									</div>
								</div>
								<p className="text-xs text-aura-muted mt-4 text-center italic">
									Au-delà de ces seuils, passage aux plans supérieurs
								</p>
							</div>
						</RevealOnScroll>

						{/* Options Boost */}
						<RevealOnScroll className="space-y-6" delay={150}>
							<div className="flex items-center gap-3">
								<div className="w-12 h-12 rounded-full bg-aura-gold/10 flex items-center justify-center">
									<span className="material-symbols-outlined text-aura-gold">rocket_launch</span>
								</div>
								<h3 className="text-xl font-serif">Options de Visibilité</h3>
							</div>

							<p className="text-aura-muted leading-relaxed">
								En plus des abonnements, les créateurs peuvent{' '}
								<span className="text-white">booster ponctuellement</span> leur visibilité pour
								maximiser leurs chances de vente.
							</p>

							<div className="space-y-4">
								<div className="flex items-start gap-4 p-4 bg-aura-bg/50 rounded-xl border border-aura-surface">
									<div className="w-10 h-10 rounded-lg bg-aura-gold/10 flex items-center justify-center shrink-0">
										<span className="material-symbols-outlined text-aura-gold text-[20px]">
											campaign
										</span>
									</div>
									<div>
										<h4 className="font-medium text-white">Boost Annonce</h4>
										<p className="text-sm text-aura-muted">
											Mettre en avant un article spécifique pendant une durée choisie
										</p>
									</div>
								</div>

								<div className="flex items-start gap-4 p-4 bg-aura-bg/50 rounded-xl border border-aura-surface">
									<div className="w-10 h-10 rounded-lg bg-aura-gold/10 flex items-center justify-center shrink-0">
										<span className="material-symbols-outlined text-aura-gold text-[20px]">
											storefront
										</span>
									</div>
									<div>
										<h4 className="font-medium text-white">Boost Vitrine</h4>
										<p className="text-sm text-aura-muted">
											Augmenter la visibilité de toute sa boutique pendant une période donnée
										</p>
									</div>
								</div>
							</div>
						</RevealOnScroll>
					</div>
				</div>
			</section>

			{/* Section Fonctionnalités Clés */}
			<section className="py-16 md:py-24 px-6 bg-[#121E1C]">
				<div className="max-w-7xl mx-auto">
					<SectionTitle title="Fonctionnalités" subtitle="Clés" />

					<div className="grid md:grid-cols-3 gap-8 mt-12">
						{/* Vitrine Créateur */}
						<RevealOnScroll className="bg-aura-card rounded-3xl p-8 border border-aura-surface">
							<div className="w-14 h-14 rounded-2xl bg-aura-accent/10 flex items-center justify-center mb-6">
								<span className="material-symbols-outlined text-aura-accent text-[28px]">
									storefront
								</span>
							</div>
							<h3 className="text-xl font-serif mb-4">Vitrine Créateur</h3>
							<ul className="space-y-2 text-sm text-aura-muted">
								<li className="flex items-center gap-2">
									<span className="w-1.5 h-1.5 rounded-full bg-aura-accent" />
									Profil personnalisé
								</li>
								<li className="flex items-center gap-2">
									<span className="w-1.5 h-1.5 rounded-full bg-aura-accent" />
									Portfolio de créations
								</li>
								<li className="flex items-center gap-2">
									<span className="w-1.5 h-1.5 rounded-full bg-aura-accent" />
									Certification visible
								</li>
							</ul>
						</RevealOnScroll>

						{/* Gestion Simplifiée */}
						<RevealOnScroll
							className="bg-aura-card rounded-3xl p-8 border border-aura-surface"
							delay={100}
						>
							<div className="w-14 h-14 rounded-2xl bg-aura-gold/10 flex items-center justify-center mb-6">
								<span className="material-symbols-outlined text-aura-gold text-[28px]">
									inventory_2
								</span>
							</div>
							<h3 className="text-xl font-serif mb-4">Gestion Simplifiée</h3>
							<ul className="space-y-2 text-sm text-aura-muted">
								<li className="flex items-center gap-2">
									<span className="w-1.5 h-1.5 rounded-full bg-aura-gold" />
									Mise en ligne &lt; 5 min
								</li>
								<li className="flex items-center gap-2">
									<span className="w-1.5 h-1.5 rounded-full bg-aura-gold" />
									Gestion des commandes
								</li>
								<li className="flex items-center gap-2">
									<span className="w-1.5 h-1.5 rounded-full bg-aura-gold" />
									Dashboard intuitif
								</li>
							</ul>
						</RevealOnScroll>

						{/* Confiance Acheteur */}
						<RevealOnScroll
							className="bg-aura-card rounded-3xl p-8 border border-aura-surface"
							delay={200}
						>
							<div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6">
								<span className="material-symbols-outlined text-green-400 text-[28px]">
									verified_user
								</span>
							</div>
							<h3 className="text-xl font-serif mb-4">Confiance Acheteur</h3>
							<ul className="space-y-2 text-sm text-aura-muted">
								<li className="flex items-center gap-2">
									<span className="w-1.5 h-1.5 rounded-full bg-green-400" />
									Créateurs vérifiés
								</li>
								<li className="flex items-center gap-2">
									<span className="w-1.5 h-1.5 rounded-full bg-green-400" />
									Pièces documentées
								</li>
								<li className="flex items-center gap-2">
									<span className="w-1.5 h-1.5 rounded-full bg-green-400" />
									Paiement sécurisé (Stripe)
								</li>
							</ul>
						</RevealOnScroll>
					</div>
				</div>
			</section>

			{/* Section Stack Technique */}
			<section className="py-16 md:py-24 px-6">
				<div className="max-w-7xl mx-auto">
					<SectionTitle title="Stack" subtitle="Technique" />

					<div className="grid lg:grid-cols-2 gap-12 lg:gap-16 mt-12">
						{/* Choix techniques */}
						<RevealOnScroll className="space-y-6">
							<h3 className="text-xl font-serif">Choix techniques</h3>

							<div className="space-y-4">
								<div className="flex items-start gap-4 p-4 bg-aura-card rounded-xl border border-aura-accent/30">
									<div className="w-10 h-10 rounded-lg bg-aura-accent/10 flex items-center justify-center shrink-0">
										<span className="material-symbols-outlined text-aura-accent text-[20px]">
											hexagon
										</span>
									</div>
									<div>
										<h4 className="font-medium text-white">Architecture Hexagonale</h4>
										<p className="text-sm text-aura-muted">
											Séparation domaine métier / infrastructure pour une maintenabilité optimale
										</p>
									</div>
								</div>

								<div className="flex items-start gap-4 p-4 bg-aura-card rounded-xl border border-aura-surface">
									<div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src="https://cdn.simpleicons.org/nextdotjs/white"
											alt="Next.js"
											className="w-5 h-5"
										/>
									</div>
									<div>
										<h4 className="font-medium text-white">Next.js + React</h4>
										<p className="text-sm text-aura-muted">
											Framework fullstack avec SSR pour une UX optimale
										</p>
									</div>
								</div>

								<div className="flex items-start gap-4 p-4 bg-aura-card rounded-xl border border-aura-surface">
									<div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src="https://cdn.simpleicons.org/postgresql/white"
											alt="PostgreSQL"
											className="w-5 h-5"
										/>
									</div>
									<div>
										<h4 className="font-medium text-white">PostgreSQL</h4>
										<p className="text-sm text-aura-muted">
											Base de données relationnelle robuste et performante
										</p>
									</div>
								</div>

								<div className="flex items-start gap-4 p-4 bg-aura-card rounded-xl border border-aura-surface">
									<div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src="https://cdn.simpleicons.org/stripe/white"
											alt="Stripe"
											className="w-5 h-5"
										/>
									</div>
									<div>
										<h4 className="font-medium text-white">Stripe Connect</h4>
										<p className="text-sm text-aura-muted">
											Paiements multi-vendeurs (split payments)
										</p>
									</div>
								</div>
							</div>
						</RevealOnScroll>

						{/* Pourquoi ces choix */}
						<RevealOnScroll
							className="bg-aura-card rounded-3xl p-8 border border-aura-surface"
							delay={150}
						>
							<h3 className="text-xl font-serif mb-6">Pourquoi ces choix ?</h3>

							<ul className="space-y-4 text-aura-muted">
								<li className="flex items-start gap-3">
									<span className="text-aura-accent mt-1">
										<span className="material-symbols-outlined text-[18px]">hexagon</span>
									</span>
									<span>
										<span className="text-white">Architecture Hexagonale</span> — Domaine métier
										isolé, testabilité maximale et évolutions simplifiées
									</span>
								</li>
								<li className="flex items-start gap-3">
									<span className="text-aura-accent mt-1">
										<span className="material-symbols-outlined text-[18px]">bolt</span>
									</span>
									<span>
										<span className="text-white">Écosystème React</span> — Large communauté,
										composants réutilisables et itérations rapides
									</span>
								</li>
								<li className="flex items-start gap-3">
									<span className="text-aura-accent mt-1">
										<span className="material-symbols-outlined text-[18px]">storage</span>
									</span>
									<span>
										<span className="text-white">PostgreSQL</span> — Relations complexes
										(créateurs, produits, commandes) gérées nativement
									</span>
								</li>
								<li className="flex items-start gap-3">
									<span className="text-aura-accent mt-1">
										<span className="material-symbols-outlined text-[18px]">security</span>
									</span>
									<span>
										<span className="text-white">Confiance financière</span> — Stripe Connect gère
										la complexité des paiements multi-parties
									</span>
								</li>
							</ul>
						</RevealOnScroll>
					</div>
				</div>
			</section>

			{/* Section Ce que ça change */}
			<section className="py-16 md:py-24 px-6">
				<div className="max-w-7xl mx-auto">
					<SectionTitle title="Ce que ça" subtitle="change" />

					<div className="grid md:grid-cols-2 gap-12 lg:gap-16 mt-12">
						{/* Pour les Créateurs */}
						<RevealOnScroll>
							<div className="flex items-center gap-3 mb-6">
								<div className="w-10 h-10 rounded-full bg-aura-accent/10 flex items-center justify-center">
									<span className="material-symbols-outlined text-aura-accent text-[20px]">
										palette
									</span>
								</div>
								<h3 className="text-lg font-serif">Pour les Créateurs</h3>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="bg-aura-card rounded-xl p-4 border border-aura-surface">
									<span className="block text-2xl font-serif text-aura-accent mb-1">+50%</span>
									<span className="text-xs text-aura-muted">Temps créatif récupéré</span>
								</div>
								<div className="bg-aura-card rounded-xl p-4 border border-aura-surface">
									<span className="block text-2xl font-serif text-white mb-1">x3</span>
									<span className="text-xs text-aura-muted">Taux de conversion</span>
								</div>
							</div>
						</RevealOnScroll>

						{/* Pour les Acheteurs */}
						<RevealOnScroll delay={150}>
							<div className="flex items-center gap-3 mb-6">
								<div className="w-10 h-10 rounded-full bg-aura-gold/10 flex items-center justify-center">
									<span className="material-symbols-outlined text-aura-gold text-[20px]">
										shopping_bag
									</span>
								</div>
								<h3 className="text-lg font-serif">Pour les Acheteurs</h3>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="bg-aura-card rounded-xl p-4 border border-aura-surface">
									<span className="block text-2xl font-serif text-aura-gold mb-1">Vérifiés</span>
									<span className="text-xs text-aura-muted">Chaque créateur</span>
								</div>
								<div className="bg-aura-card rounded-xl p-4 border border-aura-surface">
									<span className="block text-2xl font-serif text-white mb-1">Documentées</span>
									<span className="text-xs text-aura-muted">Chaque pièce</span>
								</div>
								<div className="bg-aura-card rounded-xl p-4 border border-aura-surface">
									<span className="block text-2xl font-serif text-white mb-1">Direct</span>
									<span className="text-xs text-aura-muted">Soutien au créateur</span>
								</div>
								<div className="bg-aura-card rounded-xl p-4 border border-aura-surface">
									<span className="block text-2xl font-serif text-aura-gold mb-1">Fini</span>
									<span className="text-xs text-aura-muted">Le doute</span>
								</div>
							</div>
						</RevealOnScroll>
					</div>
				</div>
			</section>

			{/* Section Vision/Mission */}
			<section className="py-16 md:py-24 px-6">
				<RevealOnScroll className="max-w-3xl mx-auto text-center">
					<blockquote className="text-2xl md:text-3xl font-serif leading-relaxed">
						&quot;Notre mission ? Rendre la rencontre entre créateurs et acheteurs aussi{' '}
						<span className="text-aura-accent italic">simple</span> qu&apos;
						<span className="text-aura-gold italic">évidente</span>.&quot;
					</blockquote>
				</RevealOnScroll>
			</section>

			{/* Section Témoignage */}
			<section className="py-16 md:py-24 px-6 bg-aura-card relative overflow-hidden">
				<RevealOnScroll className="max-w-4xl mx-auto text-center relative z-10">
					<div className="w-16 h-16 rounded-full bg-aura-surface flex items-center justify-center mx-auto mb-8">
						<span className="material-symbols-outlined text-aura-accent text-[32px]">
							format_quote
						</span>
					</div>

					<blockquote className="text-lg md:text-xl font-serif leading-relaxed mb-8 italic">
						&quot;Avant KPSULL, je jonglais entre Instagram, Vinted et les relances par mail — sans
						jamais vraiment toucher les bonnes personnes. Aujourd&apos;hui, ma vitrine est
						professionnelle, mes commandes centralisées, et les acheteurs qui arrivent{' '}
						<span className="text-aura-accent">cherchent exactement ce que je propose</span>. Je
						peux enfin me concentrer sur ce que j&apos;aime : créer.&quot;
					</blockquote>

					<div className="flex flex-col items-center gap-3">
						<div className="w-14 h-14 rounded-full bg-aura-surface flex items-center justify-center">
							<span className="material-symbols-outlined text-aura-muted text-[28px]">person</span>
						</div>
						<div>
							<div className="font-medium text-white">Marie L.</div>
							<div className="text-sm text-aura-muted">Créatrice textile, Paris</div>
						</div>
					</div>
				</RevealOnScroll>

				{/* Decoration */}
				<div className="absolute right-10 top-10 opacity-5 -rotate-12">
					<span className="material-symbols-outlined text-[200px]">checkroom</span>
				</div>
			</section>
		</>
	);
}
