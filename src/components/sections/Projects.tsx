import Link from 'next/link';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { RevealOnScroll } from '@/components/animation/RevealOnScroll';
import { RevealImage } from '@/components/animation/RevealImage';
import { Button } from '@/components/ui/Button';
import { projects } from '@/lib/data/projects';

const projectImages: Record<string, string> = {
	'meca-services': '/images/mockup-mecaservices.png',
	kpsull: '/images/mockup-kpsull.png'
};

export function Projects() {
	return (
		<section className="py-14 md:py-24 max-w-7xl mx-auto px-6 scroll-mt-32" id="projects">
			<div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
				<div>
					<SectionTitle title="Réalisations" subtitle="Sélectionnées" align="left" />
					<p className="text-aura-muted max-w-md mt-[-3rem]">
						Des solutions sur mesure qui allient esthétisme et performance brute.
					</p>
				</div>
			</div>

			<div className="space-y-24">
				{projects.map((project, i) => {
					const reversed = i % 2 !== 0;
					return (
						<div key={project.slug} className="block group">
							<RevealOnScroll className="grid md:grid-cols-2 gap-12 items-center">
								{/* Image Column */}
								<div className={reversed ? 'md:order-2' : ''}>
									<Link
										href={`/projects/${project.slug}`}
										className="block relative rounded-3xl overflow-hidden aspect-[4/3] border border-aura-surface"
										aria-label={`Voir le projet ${project.title}`}
									>
										<RevealImage
											src={projectImages[project.slug]}
											alt={project.title}
											fill
											sizes="(max-width: 768px) 100vw, 50vw"
											className="object-cover"
											wrapperClassName="absolute inset-0"
										/>
										<div className="absolute inset-0 bg-black/20" />
									</Link>
								</div>

								{/* Text Column */}
								<div className={`space-y-6 ${reversed ? 'md:text-right md:order-1' : ''}`}>
									<div className={`flex flex-wrap gap-3 ${reversed ? 'md:justify-end' : ''}`}>
										{project.tags.map((tag) => (
											<span
												key={tag}
												className={`px-3 py-1 rounded-full border border-aura-surface text-xs uppercase tracking-wider text-center whitespace-nowrap ${
													tag === 'Refonte Totale' || tag === 'Cofondateur'
														? 'text-aura-accent border-aura-accent/50'
														: 'text-aura-muted'
												}`}
											>
												{tag}
											</span>
										))}
									</div>

									<div>
										<Link
											href={`/projects/${project.slug}`}
											className="inline-block hover:text-aura-accent transition-colors"
										>
											<h3 className="text-3xl font-serif mb-2 group-hover:text-aura-accent transition-colors duration-300">
												{project.title}
											</h3>
										</Link>
										<p className="text-xs text-aura-muted">{project.subtitle}</p>
									</div>

									<p className="text-aura-muted leading-relaxed">{project.description}</p>

									<div
										className={`grid grid-cols-2 gap-4 border-t border-aura-surface pt-6 ${
											reversed ? 'md:justify-items-end' : ''
										}`}
									>
										{project.results.slice(0, 2).map((result) => (
											<div key={result.label}>
												<span className="block text-2xl font-serif text-white">{result.value}</span>
												<span className="text-xs text-aura-muted">{result.label}</span>
											</div>
										))}
									</div>

									<div className={`pt-2 ${reversed ? 'md:flex md:justify-end' : ''}`}>
										<Button href={`/projects/${project.slug}`} variant="primary" magnetic>
											Voir le projet
											<span className="material-symbols-outlined text-sm">arrow_forward</span>
										</Button>
									</div>
								</div>
							</RevealOnScroll>
						</div>
					);
				})}
			</div>
		</section>
	);
}
