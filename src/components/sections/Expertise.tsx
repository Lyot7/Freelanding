import { SectionTitle } from '@/components/ui/SectionTitle';
import { RevealOnScroll } from '@/components/animation/RevealOnScroll';

const CARDS = [
	{
		icon: 'architecture',
		title: 'Architecture & Refonte',
		body: 'Je ne fais pas que coder, je repense la structure même de vos outils. Obsédé par la performance et la scalabilité de votre infrastructure.',
		items: ['Modernisation Legacy', 'Architecture hexagonale'],
		featured: false
	},
	{
		icon: 'psychology',
		title: 'Intégration IA',
		body: "Le cœur de mon offre. Déploiement d'agents autonomes qui travaillent pour vous pendant que vous dormez. Support, analyse, rédaction.",
		items: ['Agents personnalisés', 'Automatisation N8N'],
		featured: true
	},
	{
		icon: 'speed',
		title: 'Audit de Productivité',
		body: "Avant toute ligne de code, une analyse profonde de vos processus. J'identifie où vous perdez de l'argent et comment le récupérer.",
		items: ['Audit Technique', 'Roadmap ROI'],
		featured: false
	}
];

export function Expertise() {
	return (
		<section className="py-14 md:py-24 max-w-7xl mx-auto px-6 scroll-mt-32" id="expertise">
			<SectionTitle title="Expertise" subtitle="Premium" />

			<div className="grid md:grid-cols-3 gap-6">
				{CARDS.map((card, i) => (
					<RevealOnScroll
						key={card.title}
						delay={100 * (i + 1)}
						className={`aura-card bg-aura-card p-10 rounded-[32px] border relative overflow-hidden group ${
							card.featured
								? 'border-aura-accent/30 shadow-[0_0_30px_rgba(111,240,211,0.05)]'
								: 'border-aura-surface'
						}`}
					>
						<div className="absolute top-0 right-0 opacity-10 group-hover:opacity-15 transition-opacity pointer-events-none">
							<span
								className={`material-symbols-outlined ${card.featured ? 'text-aura-accent' : ''}`}
								style={{ fontSize: '200px', lineHeight: 1 }}
							>
								{card.icon}
							</span>
						</div>
						<h3 className={`text-2xl font-serif mb-4 ${card.featured ? 'text-white' : ''}`}>
							{card.title}
						</h3>
						<p className="text-aura-muted leading-relaxed mb-8">{card.body}</p>
						<ul className="space-y-3 text-sm text-aura-muted border-t border-aura-surface pt-6">
							{card.items.map((item) => (
								<li key={item} className="flex items-center gap-2">
									<span className="w-1.5 h-1.5 rounded-full bg-aura-accent" />
									{item}
								</li>
							))}
						</ul>
					</RevealOnScroll>
				))}
			</div>
		</section>
	);
}
