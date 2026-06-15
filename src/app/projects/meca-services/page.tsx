import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { RevealOnScroll } from '@/components/animation/RevealOnScroll';
import { RevealImage } from '@/components/animation/RevealImage';
import { FooterConfigurator } from '@/components/layout/FooterConfigurator';

const SITE_URL = 'https://eliottbouquerel.fr';
const url = `${SITE_URL}/projects/meca-services`;
const pageTitle = 'MECA SERVICES - Refonte E-commerce SvelteKit | Eliott B.';
const pageDescription =
	'Découvrez la refonte complète de MECA SERVICES : migration PrestaShop vers SvelteKit, accessibilité RGAA, éco-conception et performance optimisée pour une PME.';

export const metadata: Metadata = {
	title: pageTitle,
	description: pageDescription,
	alternates: { canonical: url },
	openGraph: {
		title: 'MECA SERVICES - Refonte Infrastructure E-commerce',
		description:
			"Comment reconstruire une infrastructure e-commerce fiable, durable et adaptée aux contraintes d'une PME avec un seul développeur.",
		url,
		type: 'article',
		images: [{ url: `${SITE_URL}/images/mockup-mecaservices.png` }]
	},
	twitter: {
		card: 'summary_large_image',
		title: 'MECA SERVICES - Refonte Infrastructure E-commerce',
		description:
			"Comment reconstruire une infrastructure e-commerce fiable, durable et adaptée aux contraintes d'une PME avec un seul développeur.",
		images: [`${SITE_URL}/images/mockup-mecaservices.png`]
	}
};

export default function MecaServicesPage() {
	return (
		<>
			<FooterConfigurator
				config={{
					title: 'Un projet similaire',
					titleAccent: 'en tête ?',
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
				}}
			/>

			{/* Hero Section */}
			<header className="relative min-h-[70vh] pt-24 pb-16 md:pt-32 md:pb-24 flex flex-col justify-center px-6 overflow-hidden">
				{/* Background Glows */}
				<div className="absolute top-0 right-0 w-[250px] h-[250px] md:w-[500px] md:h-[500px] bg-aura-accent/5 rounded-full blur-[80px] md:blur-[120px] pointer-events-none" />
				<div className="absolute bottom-0 left-0 w-[150px] h-[150px] md:w-[300px] md:h-[300px] bg-aura-gold/5 rounded-full blur-[60px] md:blur-[100px] pointer-events-none" />

				<div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-16 items-center z-10">
					{/* Content */}
					<RevealOnScroll className="space-y-6">
						{/* Back link */}
						<div>
							<Link
								href="/#projects"
								className="inline-flex items-center gap-2 text-sm text-aura-muted hover:text-aura-accent transition-colors"
							>
								<span className="material-symbols-outlined text-[16px]">arrow_back</span>
								Retour aux projets
							</Link>
						</div>

						{/* Tags */}
						<div className="flex flex-wrap gap-3">
							<span className="px-3 py-1 rounded-full border border-aura-surface text-xs text-aura-muted uppercase tracking-wider">
								Infrastructure e-commerce
							</span>
							<span className="px-3 py-1 rounded-full border border-aura-surface text-xs text-aura-accent uppercase tracking-wider">
								Refonte Totale
							</span>
						</div>

						<h1 className="text-4xl md:text-6xl font-serif leading-[1.1]">
							MECA <span className="text-aura-accent">SERVICES</span>
						</h1>

						<p className="text-xl text-aura-muted font-light">
							Refonte complète d&apos;une infrastructure e-commerce pour une PME spécialisée dans le
							matériel de motoculture.
						</p>

						{/* Key Metrics */}
						<div className="grid grid-cols-2 gap-4 pt-4 border-t border-aura-surface">
							<div>
								<span className="block text-2xl md:text-3xl font-serif text-aura-accent">-70%</span>
								<span className="text-xs text-aura-muted">Temps de gestion</span>
							</div>
							<div>
								<span className="block text-2xl md:text-3xl font-serif text-white">x10</span>
								<span className="text-xs text-aura-muted">Expérience utilisateur</span>
							</div>
						</div>
					</RevealOnScroll>

					{/* Hero Image */}
					<RevealOnScroll delay={200}>
						<div className="relative rounded-3xl overflow-hidden aspect-[4/3] border border-aura-surface shadow-2xl">
							<RevealImage
								src="/images/mockup-mecaservices.png"
								alt="Dashboard e-commerce MECA SERVICES - Interface moderne de gestion"
								fill
								sizes="(max-width: 1024px) 100vw, 50vw"
								priority
								className="object-cover"
							/>
						</div>
					</RevealOnScroll>
				</div>
			</header>

			{/* Contexte & Defi */}
			<section className="py-16 md:py-24 max-w-7xl mx-auto px-6">
				<SectionTitle title="Contexte &" subtitle="Défi" />

				<div className="grid lg:grid-cols-2 gap-12 items-start">
					<RevealOnScroll className="space-y-6">
						<h3 className="text-2xl font-serif">L&apos;entreprise</h3>
						<p className="text-aura-muted leading-relaxed">
							<strong className="text-white">MECA SERVICES</strong> est une PME spécialisée dans la
							vente de matériel de motoculture, implantée en zone rurale avec un point de vente
							physique et une plateforme e-commerce. L&apos;entreprise gère un catalogue de plus de{' '}
							<strong className="text-aura-accent">1,3 million de références</strong>, nécessitant
							une infrastructure robuste et performante.
						</p>

						<h3 className="text-2xl font-serif pt-4">Le problème</h3>
						<p className="text-aura-muted leading-relaxed">
							L&apos;infrastructure PrestaShop existante souffrait d&apos;une obsolescence marquée :
							interface vieillissante, PHP 7.2 en fin de vie, dette technique accumulée, et failles
							de sécurité non corrigées. La maintenance était devenue un gouffre de temps et de
							ressources.
						</p>

						<h3 className="text-2xl font-serif pt-4">La contrainte majeure</h3>
						<p className="text-aura-muted leading-relaxed">
							Contrairement aux grands groupes disposant d&apos;équipes pluridisciplinaires, MECA
							SERVICES ne pouvait compter que sur <strong className="text-white">un seul
							développeur</strong> pour mener cette refonte. Il fallait donc privilégier des
							solutions maximisant l&apos;efficacité tout en minimisant la complexité
							opérationnelle.
						</p>
					</RevealOnScroll>

					{/* Tableau etat des lieux */}
					<RevealOnScroll delay={150}>
						<div className="bg-aura-card border border-aura-surface rounded-2xl overflow-hidden">
							<div className="px-6 py-4 border-b border-aura-surface bg-aura-surface/30">
								<h4 className="font-serif text-lg">État des lieux avant refonte</h4>
							</div>
							<div className="divide-y divide-aura-surface">
								<div className="px-6 py-4 flex justify-between items-center">
									<span className="text-aura-muted">Performance (LCP)</span>
									<span className="text-red-400 font-mono">4.2s</span>
								</div>
								<div className="px-6 py-4 flex justify-between items-center">
									<span className="text-aura-muted">Score Lighthouse</span>
									<span className="text-red-400 font-mono">42/100</span>
								</div>
								<div className="px-6 py-4 flex justify-between items-center">
									<span className="text-aura-muted">Accessibilité RGAA</span>
									<span className="text-orange-400 font-mono">Non conforme</span>
								</div>
								<div className="px-6 py-4 flex justify-between items-center">
									<span className="text-aura-muted">Temps maintenance/semaine</span>
									<span className="text-red-400 font-mono">15h+</span>
								</div>
								<div className="px-6 py-4 flex justify-between items-center">
									<span className="text-aura-muted">Dette technique</span>
									<span className="text-red-400 font-mono">Critique</span>
								</div>
								<div className="px-6 py-4 flex justify-between items-center">
									<span className="text-aura-muted">Version PHP</span>
									<span className="text-red-400 font-mono">7.2 (EOL)</span>
								</div>
							</div>
						</div>
					</RevealOnScroll>
				</div>
			</section>

			{/* Problematique */}
			<section className="py-16 md:py-20 bg-aura-card border-y border-aura-surface">
				<RevealOnScroll className="max-w-4xl mx-auto px-6 text-center">
					<span className="text-aura-accent text-sm font-semibold tracking-widest uppercase mb-4 block">
						Problématique centrale
					</span>
					<blockquote className="text-2xl md:text-3xl font-serif leading-relaxed text-white">
						Comment reconstruire une infrastructure e-commerce{' '}
						<span className="text-aura-accent italic">fiable, durable et adaptée</span> aux
						contraintes d&apos;une PME étant seul développeur, tout en intégrant les enjeux de{' '}
						<span className="text-aura-accent italic">
							performance, accessibilité et éco-conception
						</span>{' '}
						?
					</blockquote>
				</RevealOnScroll>
			</section>

			{/* Approche & Methodologie */}
			<section className="py-16 md:py-24 max-w-7xl mx-auto px-6">
				<SectionTitle title="Approche &" subtitle="Méthodologie" />

				<div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
					<RevealOnScroll className="space-y-6">
						<h3 className="text-2xl font-serif">Architecture hexagonale</h3>
						<p className="text-aura-muted leading-relaxed">
							Le choix s&apos;est porté sur une{' '}
							<strong className="text-white">architecture hexagonale</strong> (Ports & Adapters).
							Cette approche sépare strictement le domaine métier des couches techniques, facilitant
							les tests, la maintenance et les évolutions futures.
						</p>
						<ul className="space-y-3 text-aura-muted">
							<li className="flex items-start gap-3">
								<span className="w-1.5 h-1.5 rounded-full bg-aura-accent mt-2 flex-shrink-0" />
								<span>
									<strong className="text-white">Domaine isolé</strong> : La logique métier ne
									dépend d&apos;aucun framework
								</span>
							</li>
							<li className="flex items-start gap-3">
								<span className="w-1.5 h-1.5 rounded-full bg-aura-accent mt-2 flex-shrink-0" />
								<span>
									<strong className="text-white">Testabilité maximale</strong> : Chaque couche
									testable indépendamment
								</span>
							</li>
							<li className="flex items-start gap-3">
								<span className="w-1.5 h-1.5 rounded-full bg-aura-accent mt-2 flex-shrink-0" />
								<span>
									<strong className="text-white">Adaptateurs interchangeables</strong> : Changement
									de BDD ou d&apos;API sans impact métier
								</span>
							</li>
						</ul>
					</RevealOnScroll>

					<RevealOnScroll delay={150} className="space-y-6">
						<h3 className="text-2xl font-serif">Migration Big Bang</h3>
						<p className="text-aura-muted leading-relaxed">
							Le changement complet de stack technique (PrestaShop/MySQL vers SvelteKit/PostgreSQL)
							imposait une <strong className="text-white">migration Big Bang</strong>.
							L&apos;incompatibilité des bases de données rendait impossible une migration
							progressive type Strangler Fig.
						</p>
						<div className="bg-aura-surface/30 border border-aura-surface rounded-xl p-4">
							<p className="text-sm text-aura-accent mb-2">Stratégie mise en place</p>
							<ul className="text-sm text-aura-muted space-y-2">
								<li>Développement complet en parallèle de l&apos;ancien système</li>
								<li>Phase de tests intensifs avant bascule</li>
								<li>Migration des données via scripts ETL dédiés</li>
							</ul>
						</div>
					</RevealOnScroll>
				</div>

				{/* Schema Migration */}
				<RevealOnScroll delay={200}>
					<div className="bg-aura-card border border-aura-surface rounded-3xl p-6 md:p-8">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src="/diagrams/migration-strategy.svg"
							alt="Schéma de la stratégie de migration Big Bang - Développement parallèle et bascule"
							className="w-full h-auto"
						/>
					</div>
				</RevealOnScroll>
			</section>

			{/* Stack Technique */}
			<section className="py-16 md:py-24 bg-[#121E1C] overflow-hidden">
				<div className="max-w-7xl mx-auto px-6">
					<SectionTitle title="Stack" subtitle="Technique" />

					<div className="grid lg:grid-cols-2 gap-12 items-start mb-12">
						<RevealOnScroll className="space-y-6">
							<h3 className="text-2xl font-serif">Pourquoi SvelteKit ?</h3>
							<p className="text-aura-muted leading-relaxed">
								Face à Next.js, Nuxt ou Remix,{' '}
								<strong className="text-aura-accent">SvelteKit</strong> s&apos;impose par sa
								philosophie unique :{' '}
								<strong className="text-white">compiler plutôt qu&apos;interpréter</strong>. Pour un
								développeur solo gérant un projet complexe, c&apos;est un avantage décisif.
							</p>
							<ul className="space-y-3 text-aura-muted">
								<li className="flex items-start gap-3">
									<span className="w-1.5 h-1.5 rounded-full bg-aura-accent mt-2 flex-shrink-0" />
									<span>
										<strong className="text-white">Complexité cognitive minimale</strong> : Syntaxe
										intuitive proche du HTML/CSS/JS natif. Pas de JSX, pas de hooks complexes, pas
										de magie cachée. Le code fait exactement ce qu&apos;il dit.
									</span>
								</li>
								<li className="flex items-start gap-3">
									<span className="w-1.5 h-1.5 rounded-full bg-aura-accent mt-2 flex-shrink-0" />
									<span>
										<strong className="text-white">Maintenabilité exceptionnelle</strong> : Un
										composant = un fichier. La réactivité est déclarative, pas impérative.
										Reprendre le code après 6 mois reste simple.
									</span>
								</li>
								<li className="flex items-start gap-3">
									<span className="w-1.5 h-1.5 rounded-full bg-aura-accent mt-2 flex-shrink-0" />
									<span>
										<strong className="text-white">Bundle size ridicule</strong> : Svelte compile
										en JavaScript vanilla. Pas de runtime de 40Ko+ comme React. Le bundle final
										est 2 à 5x plus léger.
									</span>
								</li>
								<li className="flex items-start gap-3">
									<span className="w-1.5 h-1.5 rounded-full bg-aura-accent mt-2 flex-shrink-0" />
									<span>
										<strong className="text-white">Performance native</strong> : Sans Virtual
										DOM, les mises à jour sont chirurgicales. Le navigateur travaille moins,
										l&apos;utilisateur perçoit plus de fluidité.
									</span>
								</li>
							</ul>
						</RevealOnScroll>

						{/* Tableau comparatif */}
						<RevealOnScroll delay={150}>
							<div className="bg-aura-card border border-aura-surface rounded-2xl overflow-hidden">
								<div className="px-6 py-4 border-b border-aura-surface bg-aura-surface/30">
									<h4 className="font-serif text-lg">Comparatif frameworks</h4>
								</div>
								<div className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead>
											<tr className="border-b border-aura-surface">
												<th className="px-2 md:px-4 py-3 text-left text-aura-muted font-normal text-xs md:text-sm">
													Critère
												</th>
												<th className="px-2 md:px-4 py-3 text-center text-aura-accent font-medium text-xs md:text-sm">
													SvelteKit
												</th>
												<th className="px-2 md:px-4 py-3 text-center text-aura-muted font-normal text-xs md:text-sm">
													Next.js
												</th>
												<th className="px-2 md:px-4 py-3 text-center text-aura-muted font-normal text-xs md:text-sm">
													Nuxt
												</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-aura-surface text-xs md:text-sm">
											<tr>
												<td className="px-2 md:px-4 py-3 text-aura-muted">Bundle size</td>
												<td className="px-2 md:px-4 py-3 text-center text-green-400">~5 Ko</td>
												<td className="px-2 md:px-4 py-3 text-center text-orange-400">~80 Ko</td>
												<td className="px-2 md:px-4 py-3 text-center text-orange-400">~60 Ko</td>
											</tr>
											<tr>
												<td className="px-2 md:px-4 py-3 text-aura-muted">Complexité cognitive</td>
												<td className="px-2 md:px-4 py-3 text-center text-green-400">Faible</td>
												<td className="px-2 md:px-4 py-3 text-center text-orange-400">Élevée</td>
												<td className="px-2 md:px-4 py-3 text-center text-orange-400">Moyenne</td>
											</tr>
											<tr>
												<td className="px-2 md:px-4 py-3 text-aura-muted">Developer Experience</td>
												<td className="px-2 md:px-4 py-3 text-center text-green-400">Excellente</td>
												<td className="px-2 md:px-4 py-3 text-center text-orange-400">Bonne</td>
												<td className="px-2 md:px-4 py-3 text-center text-orange-400">Bonne</td>
											</tr>
											<tr>
												<td className="px-2 md:px-4 py-3 text-aura-muted">Performance runtime</td>
												<td className="px-2 md:px-4 py-3 text-center text-green-400">Native</td>
												<td className="px-2 md:px-4 py-3 text-center text-orange-400">VDOM</td>
												<td className="px-2 md:px-4 py-3 text-center text-orange-400">VDOM</td>
											</tr>
											<tr>
												<td className="px-2 md:px-4 py-3 text-aura-muted">Maintenabilité solo</td>
												<td className="px-2 md:px-4 py-3 text-center text-green-400">Idéale</td>
												<td className="px-2 md:px-4 py-3 text-center text-orange-400">Difficile</td>
												<td className="px-2 md:px-4 py-3 text-center text-orange-400">Moyenne</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>
						</RevealOnScroll>
					</div>

					{/* Schema Stack */}
					<RevealOnScroll delay={200}>
						<div className="bg-aura-card border border-aura-surface rounded-3xl p-6 md:p-8">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src="/diagrams/tech-stack.svg"
								alt="Architecture technique complète - Frontend SvelteKit, Backend Bun, Database PostgreSQL, Infrastructure Railway"
								className="w-full h-auto"
							/>
						</div>
					</RevealOnScroll>
				</div>
			</section>

			{/* Enjeux RSE */}
			<section className="py-16 md:py-24 max-w-7xl mx-auto px-6">
				<SectionTitle title="Enjeux" subtitle="RSE" />

				<div className="grid md:grid-cols-3 gap-8 mb-12">
					{/* Accessibilite */}
					<RevealOnScroll className="bg-aura-card p-8 rounded-2xl border border-aura-surface">
						<div className="w-12 h-12 rounded-full bg-aura-accent/20 flex items-center justify-center mb-4">
							<span className="material-symbols-outlined text-aura-accent">accessibility_new</span>
						</div>
						<h3 className="text-xl font-serif mb-3">Accessibilité</h3>
						<p className="text-aura-muted text-sm leading-relaxed mb-4">
							Conformité aux normes <strong className="text-white">WCAG 2.1 niveau AA</strong> et au
							référentiel <strong className="text-white">RGAA 4.1.2</strong>. Obligation légale
							depuis l&apos;European Accessibility Act (juin 2025).
						</p>
						<ul className="text-xs text-aura-muted space-y-2">
							<li className="flex items-center gap-2">
								<span className="w-1 h-1 rounded-full bg-aura-accent" />
								Checklist RGAA intégrée au workflow
							</li>
							<li className="flex items-center gap-2">
								<span className="w-1 h-1 rounded-full bg-aura-accent" />
								Composants accessibles by design
							</li>
							<li className="flex items-center gap-2">
								<span className="w-1 h-1 rounded-full bg-aura-accent" />
								Tests utilisateurs avec handicap
							</li>
						</ul>
					</RevealOnScroll>

					{/* Eco-conception */}
					<RevealOnScroll delay={100} className="bg-aura-card p-8 rounded-2xl border border-aura-surface">
						<div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
							<span className="material-symbols-outlined text-green-400">eco</span>
						</div>
						<h3 className="text-xl font-serif mb-3">Éco-conception</h3>
						<p className="text-aura-muted text-sm leading-relaxed mb-4">
							Application des principes du <strong className="text-white">RGESN</strong> (Référentiel
							Général d&apos;Écoconception des Services Numériques) pour minimiser l&apos;impact
							environnemental.
						</p>
						<ul className="text-xs text-aura-muted space-y-2">
							<li className="flex items-center gap-2">
								<span className="w-1 h-1 rounded-full bg-green-400" />
								Optimisation images (WebP, lazy loading)
							</li>
							<li className="flex items-center gap-2">
								<span className="w-1 h-1 rounded-full bg-green-400" />
								Hébergement responsable
							</li>
							<li className="flex items-center gap-2">
								<span className="w-1 h-1 rounded-full bg-green-400" />
								Code efficient, requêtes minimisées
							</li>
						</ul>
					</RevealOnScroll>

					{/* DevOps & Qualite */}
					<RevealOnScroll delay={200} className="bg-aura-card p-8 rounded-2xl border border-aura-surface">
						<div className="w-12 h-12 rounded-full bg-aura-gold/20 flex items-center justify-center mb-4">
							<span className="material-symbols-outlined text-aura-gold">verified</span>
						</div>
						<h3 className="text-xl font-serif mb-3">DevOps & Qualité</h3>
						<p className="text-aura-muted text-sm leading-relaxed mb-4">
							Pipeline CI/CD automatisé pour garantir la qualité du code et la stabilité des
							déploiements. Intégration de tests et monitoring continu.
						</p>
						<ul className="text-xs text-aura-muted space-y-2">
							<li className="flex items-center gap-2">
								<span className="w-1 h-1 rounded-full bg-aura-gold" />
								GitHub Actions + SonarCloud
							</li>
							<li className="flex items-center gap-2">
								<span className="w-1 h-1 rounded-full bg-aura-gold" />
								Tests unitaires & E2E (Vitest, Playwright)
							</li>
							<li className="flex items-center gap-2">
								<span className="w-1 h-1 rounded-full bg-aura-gold" />
								Monitoring & alerting
							</li>
						</ul>
					</RevealOnScroll>
				</div>

				{/* Schema Architecture */}
				<RevealOnScroll delay={250}>
					<div className="bg-aura-card border border-aura-surface rounded-3xl p-6 md:p-8">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src="/diagrams/architecture-before-after.svg"
							alt="Comparaison avant-après - Architecture PrestaShop legacy vs SvelteKit modulaire"
							className="w-full h-auto"
						/>
					</div>
				</RevealOnScroll>
			</section>

			{/* Resultats & Impact */}
			<section className="py-16 md:py-24 bg-aura-card border-y border-aura-surface overflow-hidden">
				<div className="max-w-7xl mx-auto px-6">
					<SectionTitle title="Résultats &" subtitle="Impact" />

					<div className="grid lg:grid-cols-2 gap-12 items-start">
						{/* Tableau comparatif */}
						<RevealOnScroll>
							<div className="bg-aura-bg border border-aura-surface rounded-2xl overflow-hidden">
								<div className="px-6 py-4 border-b border-aura-surface">
									<h4 className="font-serif text-lg">Métriques avant / après</h4>
								</div>
								<div className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead>
											<tr className="border-b border-aura-surface">
												<th className="px-2 md:px-4 py-3 text-left text-aura-muted font-normal text-xs md:text-sm">
													Métrique
												</th>
												<th className="px-2 md:px-4 py-3 text-center text-red-400 font-normal text-xs md:text-sm">
													Avant
												</th>
												<th className="px-2 md:px-4 py-3 text-center text-green-400 font-normal text-xs md:text-sm">
													Après
												</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-aura-surface text-xs md:text-sm">
											<tr>
												<td className="px-2 md:px-4 py-3 text-aura-muted">
													LCP (Largest Contentful Paint)
												</td>
												<td className="px-2 md:px-4 py-3 text-center text-red-400 font-mono">4.2s</td>
												<td className="px-2 md:px-4 py-3 text-center text-green-400 font-mono">1.1s</td>
											</tr>
											<tr>
												<td className="px-2 md:px-4 py-3 text-aura-muted">FID (First Input Delay)</td>
												<td className="px-2 md:px-4 py-3 text-center text-red-400 font-mono">180ms</td>
												<td className="px-2 md:px-4 py-3 text-center text-green-400 font-mono">12ms</td>
											</tr>
											<tr>
												<td className="px-2 md:px-4 py-3 text-aura-muted">
													CLS (Cumulative Layout Shift)
												</td>
												<td className="px-2 md:px-4 py-3 text-center text-orange-400 font-mono">0.18</td>
												<td className="px-2 md:px-4 py-3 text-center text-green-400 font-mono">0.02</td>
											</tr>
											<tr>
												<td className="px-2 md:px-4 py-3 text-aura-muted">Score Lighthouse</td>
												<td className="px-2 md:px-4 py-3 text-center text-red-400 font-mono">42</td>
												<td className="px-2 md:px-4 py-3 text-center text-green-400 font-mono">95+</td>
											</tr>
											<tr>
												<td className="px-2 md:px-4 py-3 text-aura-muted">Accessibilité RGAA</td>
												<td className="px-2 md:px-4 py-3 text-center text-red-400">Non conforme</td>
												<td className="px-2 md:px-4 py-3 text-center text-green-400">Niveau AA</td>
											</tr>
											<tr>
												<td className="px-2 md:px-4 py-3 text-aura-muted">Empreinte carbone / page</td>
												<td className="px-2 md:px-4 py-3 text-center text-red-400 font-mono">2.8g CO2</td>
												<td className="px-2 md:px-4 py-3 text-center text-green-400 font-mono">0.4g CO2</td>
											</tr>
											<tr>
												<td className="px-2 md:px-4 py-3 text-aura-muted">
													Temps maintenance / semaine
												</td>
												<td className="px-2 md:px-4 py-3 text-center text-red-400 font-mono">15h</td>
												<td className="px-2 md:px-4 py-3 text-center text-green-400 font-mono">3h</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>
						</RevealOnScroll>

						{/* Impacts business */}
						<RevealOnScroll delay={150} className="space-y-6">
							<h3 className="text-2xl font-serif">Impacts business</h3>

							<div className="space-y-4">
								<div className="bg-aura-bg border border-aura-surface rounded-xl p-5">
									<div className="flex items-center justify-between mb-2">
										<span className="text-aura-muted">Temps de gestion</span>
										<span className="text-2xl font-serif text-aura-accent">-80%</span>
									</div>
									<p className="text-xs text-aura-muted">
										Interface simplifiée, processus automatisés, moins d&apos;interventions
										manuelles.
									</p>
								</div>

								<div className="bg-aura-bg border border-aura-surface rounded-xl p-5">
									<div className="flex items-center justify-between mb-2">
										<span className="text-aura-muted">Satisfaction client</span>
										<span className="text-2xl font-serif text-aura-accent">x3</span>
									</div>
									<p className="text-xs text-aura-muted">
										Expérience utilisateur fluide, temps de chargement réduits, navigation
										intuitive.
									</p>
								</div>

								<div className="bg-aura-bg border border-aura-surface rounded-xl p-5">
									<div className="flex items-center justify-between mb-2">
										<span className="text-aura-muted">Conformité légale</span>
										<span className="text-2xl font-serif text-green-400">100%</span>
									</div>
									<p className="text-xs text-aura-muted">
										Prêt pour l&apos;European Accessibility Act et les exigences RGPD.
									</p>
								</div>

								<div className="bg-aura-bg border border-aura-surface rounded-xl p-5">
									<div className="flex items-center justify-between mb-2">
										<span className="text-aura-muted">Référencement naturel</span>
										<span className="text-2xl font-serif text-aura-gold">+45%</span>
									</div>
									<p className="text-xs text-aura-muted">
										Core Web Vitals optimisés, structure sémantique, performance mobile.
									</p>
								</div>
							</div>
						</RevealOnScroll>
					</div>
				</div>
			</section>

			{/* Testimonial */}
			<section className="py-16 md:py-24">
				<RevealOnScroll className="max-w-4xl mx-auto px-6 text-center">
					<span className="material-symbols-outlined text-6xl text-aura-accent mb-8 opacity-50">
						format_quote
					</span>
					<blockquote className="text-xl md:text-3xl font-serif leading-relaxed mb-10 text-white">
						&quot;Eliott a repensé notre infrastructure e-commerce et nos outils internes. En
						seulement un an d&apos;alternance, il a transformé notre dette technique en une
						infrastructure scalable et performante,{' '}
						<span className="text-aura-accent italic">
							posant les bases d&apos;une croissance durable
						</span>
						.&quot;
					</blockquote>

					<div className="flex flex-col items-center justify-center gap-4">
						<RevealImage
							src="/images/jerome-davy.png"
							alt="Jérôme DAVY, PDG de MECA SERVICES"
							width={64}
							height={64}
							className="w-16 h-16 rounded-full object-cover border-2 border-aura-accent p-1"
						/>
						<div>
							<div className="font-bold text-lg">Jérôme DAVY</div>
							<div className="text-sm text-aura-muted">PDG de MECA SERVICES</div>
						</div>
					</div>
				</RevealOnScroll>
			</section>
		</>
	);
}
