'use client';

import { useState } from 'react';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { RevealOnScroll } from '@/components/animation/RevealOnScroll';

const FAQ_ITEMS = [
	{
		q: 'Quels types de projets acceptez-vous ?',
		a: "Je travaille principalement sur des projets d'architecture web complexe, des refontes d'applications existantes, et des intégrations IA pour automatiser les processus métier des PME et startups. Mon expertise couvre aussi bien le frontend (SvelteKit, Next.js, React) que le backend (Node.js, PostgreSQL) et l'infrastructure (Docker, CI/CD)."
	},
	{
		q: 'Quelle est votre approche pour un nouveau projet ?',
		a: "Je commence toujours par un audit de productivité pour comprendre vos processus actuels, identifier les opportunités d'automatisation et établir une roadmap ROI chiffrée. Ensuite, je conçois l'architecture technique avant d'écrire la moindre ligne de code. Cette approche garantit des solutions durables et évolutives."
	},
	{
		q: "Comment l'IA peut-elle aider mon entreprise concrètement ?",
		a: "L'IA peut automatiser les tâches répétitives qui consomment le temps de vos équipes : tri et réponse aux emails, génération de rapports, analyse de données, support client de premier niveau, rédaction de contenus. En moyenne, mes clients récupèrent entre 5 et 15 heures par semaine par personne concernée."
	},
	{
		q: 'Travaillez-vous en remote ou sur site ?',
		a: 'Basé en Normandie (Caen), je travaille principalement en remote avec des outils collaboratifs modernes (Discord, Notion, visio). Je peux me déplacer en Normandie et en région parisienne pour les réunions stratégiques ou les ateliers de cadrage. Mon organisation garantit une communication fluide et une livraison régulière.'
	},
	{
		q: 'Quel est le délai pour démarrer un projet ?',
		a: "Après un premier échange de 30 minutes (gratuit), je vous envoie une proposition sous 48h. Le démarrage effectif dépend de ma disponibilité actuelle. Prenez rendez-vous sur mon calendrier pour connaître mes créneaux disponibles et discuter de votre projet."
	}
];

function FaqItem({ q, a, delay }: { q: string; a: string; delay: number }) {
	const [open, setOpen] = useState(false);
	return (
		<RevealOnScroll
			delay={delay}
			className="group bg-aura-card border border-aura-surface rounded-2xl"
		>
			<button
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				className="w-full flex items-center justify-between p-6 cursor-pointer hover:bg-aura-surface/30 transition-colors rounded-2xl text-left"
			>
				<h3 className="text-lg font-serif pr-4">{q}</h3>
				<span
					className={`material-symbols-outlined text-aura-accent shrink-0 transition-transform duration-300 ${
						open ? 'rotate-180' : ''
					}`}
				>
					expand_more
				</span>
			</button>
			<div className="faq-content" data-open={open}>
				<div>
					<div className="px-6 pb-6">
						<p className="text-aura-muted leading-relaxed">{a}</p>
					</div>
				</div>
			</div>
		</RevealOnScroll>
	);
}

export function Faq() {
	return (
		<section className="py-14 md:py-24 max-w-7xl mx-auto px-6 scroll-mt-32" id="faq">
			<SectionTitle title="Questions" subtitle="Fréquentes" />
			<div className="max-w-3xl mx-auto space-y-4">
				{FAQ_ITEMS.map((item, i) => (
					<FaqItem key={item.q} q={item.q} a={item.a} delay={i * 100} />
				))}
			</div>
		</section>
	);
}
