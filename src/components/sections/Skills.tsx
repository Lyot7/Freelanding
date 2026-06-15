import { SectionTitle } from '@/components/ui/SectionTitle';
import { RevealOnScroll } from '@/components/animation/RevealOnScroll';
import { Marquee } from '@/components/animation/Marquee';

const STACK_GROUPS = [
	{
		label: 'Frontend & Frameworks',
		accent: false,
		items: [
			{ name: 'Next.js', icon: 'nextdotjs' },
			{ name: 'React', icon: 'react' },
			{ name: 'Svelte', icon: 'svelte' },
			{ name: 'TypeScript', icon: 'typescript' },
			{ name: 'Tailwind', icon: 'tailwindcss' }
		]
	},
	{
		label: 'Backend & Base de données',
		accent: false,
		items: [
			{ name: 'Bun', icon: 'bun' },
			{ name: 'Prisma', icon: 'prisma' },
			{ name: 'PostgreSQL', icon: 'postgresql' }
		]
	},
	{
		label: 'Infrastructure & DevOps',
		accent: false,
		items: [
			{ name: 'Docker', icon: 'docker' },
			{ name: 'Coolify', icon: 'coolify' },
			{ name: 'Git', icon: 'git' },
			{ name: 'Hostinger', icon: 'hostinger' }
		]
	},
	{
		label: 'IA & Automatisation',
		accent: true,
		items: [
			{ name: 'N8N', icon: 'n8n' },
			{ name: 'Claude Code', icon: 'claude' },
			{ name: 'Gemini', icon: 'googlegemini' }
		]
	}
];

const MARQUEE_ICONS = STACK_GROUPS.flatMap((g) => g.items);

export function Skills() {
	return (
		<section className="py-16 md:py-24 max-w-7xl mx-auto px-6 scroll-mt-32" id="skills">
			<SectionTitle title="Parcours &" subtitle="Compétences" />

			<div className="grid md:grid-cols-2 gap-12 items-start">
				{/* Formation */}
				<RevealOnScroll className="space-y-8">
					<div className="flex items-start gap-4">
						<div className="flex-shrink-0 w-12 h-12 rounded-full bg-aura-accent/20 flex items-center justify-center">
							<span className="material-symbols-outlined text-aura-accent">school</span>
						</div>
						<div>
							<h3 className="text-xl font-serif mb-2">
								Master Développeur &amp; Manager de projet Web
							</h3>
							<p className="text-aura-muted text-sm leading-relaxed">
								Formation complète alliant expertise technique et management de projet. Une double
								compétence qui me permet de concevoir, développer et piloter des projets web de A à Z.
							</p>
						</div>
					</div>
					<div className="flex items-start gap-4">
						<div className="flex-shrink-0 w-12 h-12 rounded-full bg-aura-accent/10 flex items-center justify-center border border-aura-accent/20">
							<span className="material-symbols-outlined text-aura-accent">code</span>
						</div>
						<div>
							<h3 className="text-xl font-serif mb-2">
								Bachelor Métiers du Multimédia et d&apos;Internet
								<span className="text-aura-accent text-base font-normal"> - Option Développement Web</span>
							</h3>
							<p className="text-aura-muted text-sm leading-relaxed">
								Formation spécialisée en <span className="text-white">développement web</span> avec une
								approche polyvalente couvrant également le design et la communication numérique.
								Fondations solides pour une vision globale des projets digitaux.
							</p>
						</div>
					</div>
				</RevealOnScroll>

				{/* Stack */}
				<RevealOnScroll className="space-y-8" delay={200}>
					<div>
						<h3 className="text-xl font-serif mb-6">Stack Technique</h3>
						<div className="space-y-4">
							{STACK_GROUPS.map((group) => (
								<div key={group.label}>
									<p className="text-sm text-aura-muted mb-3 uppercase tracking-wider">{group.label}</p>
									<div className="flex flex-wrap gap-2">
										{group.items.map((tech) => (
											<span
												key={tech.name}
												className={`px-3 py-1.5 rounded-full border bg-aura-card text-sm transition-colors flex items-center gap-2 ${
													group.accent
														? 'border-aura-accent/30 text-aura-accent hover:border-aura-accent hover:bg-aura-accent/10'
														: 'border-aura-surface text-aura-muted hover:border-aura-accent hover:text-white'
												}`}
											>
												{/* eslint-disable-next-line @next/next/no-img-element */}
												<img
													src={`https://cdn.simpleicons.org/${tech.icon}/white`}
													alt={tech.name}
													className="w-4 h-4"
												/>
												{tech.name}
											</span>
										))}
									</div>
								</div>
							))}
						</div>
					</div>
				</RevealOnScroll>
			</div>

			{/* Marquee strip */}
			<div className="mt-16 border-y border-aura-surface/50 py-6 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
				<Marquee speed={28}>
					{MARQUEE_ICONS.map((tech, i) => (
						<span key={`${tech.name}-${i}`} className="flex items-center gap-2 text-aura-muted">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={`https://cdn.simpleicons.org/${tech.icon}/9CAFA9`}
								alt={tech.name}
								className="w-5 h-5"
							/>
							<span className="text-sm uppercase tracking-widest">{tech.name}</span>
						</span>
					))}
				</Marquee>
			</div>
		</section>
	);
}
