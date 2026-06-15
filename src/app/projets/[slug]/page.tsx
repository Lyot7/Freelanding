import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { projects } from '@/lib/data/projects';
import { Button } from '@/components/ui/Button';
import { RevealOnScroll } from '@/components/animation/RevealOnScroll';
import { breadcrumbJsonLd, jsonLdScript } from '@/lib/seo/jsonld';

const SITE_URL = 'https://eliottbouquerel.fr';

export function generateStaticParams() {
	return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
	params
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const project = projects.find((p) => p.slug === slug);
	if (!project) return {};

	const url = `${SITE_URL}/projets/${project.slug}`;
	const title = `${project.title} - Case Study | Eliott B.`;
	return {
		title,
		description: `Découvrez comment ${project.title} a transformé son activité : ${project.description}`,
		alternates: { canonical: url },
		openGraph: {
			title,
			description: project.description,
			url,
			images: [{ url: `${SITE_URL}${project.heroImage}` }]
		},
		twitter: {
			title,
			description: project.description,
			images: [`${SITE_URL}${project.heroImage}`]
		}
	};
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const project = projects.find((p) => p.slug === slug);
	if (!project) notFound();

	return (
		<div className="pt-32 pb-20">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={jsonLdScript(breadcrumbJsonLd(project))}
			/>

			{/* Hero */}
			<section className="max-w-7xl mx-auto px-6 mb-20">
				<div className="mb-8">
					<Link
						href="/#projects"
						className="text-aura-muted hover:text-aura-accent text-sm flex items-center gap-2 mb-6 transition-colors w-fit"
					>
						<span className="material-symbols-outlined text-sm">arrow_back</span>
						Retour aux projets
					</Link>
					<RevealOnScroll className="flex flex-wrap gap-3 mb-6">
						{project.tags.map((tag) => (
							<span
								key={tag}
								className="px-3 py-1 rounded-full border border-aura-surface text-xs text-aura-accent uppercase tracking-wider"
							>
								{tag}
							</span>
						))}
					</RevealOnScroll>
					<RevealOnScroll as="h1" className="text-5xl md:text-7xl font-serif mb-6 text-white" delay={100}>
						{project.title}
					</RevealOnScroll>
					<RevealOnScroll as="p" className="text-xl text-aura-muted max-w-2xl" delay={200}>
						{project.subtitle}
					</RevealOnScroll>
				</div>

				<RevealOnScroll
					className="relative aspect-video w-full rounded-[32px] overflow-hidden border border-aura-surface"
					delay={300}
				>
					<Image
						src={project.heroImage}
						alt={project.title}
						fill
						sizes="(max-width: 1280px) 100vw, 1280px"
						className="object-cover"
						priority
					/>
				</RevealOnScroll>
			</section>

			{/* Content */}
			<section className="max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-12">
				<div className="md:col-span-12 lg:col-span-8 space-y-16">
					<RevealOnScroll>
						<h2 className="text-3xl font-serif mb-6 text-white">Le Défi</h2>
						<div className="prose prose-invert prose-lg text-aura-muted">
							<p className="mb-6">{project.context}</p>
							<p className="border-l-4 border-aura-accent pl-6 italic text-white/90">
								{project.challenge}
							</p>
						</div>
					</RevealOnScroll>

					<RevealOnScroll>
						<h2 className="text-3xl font-serif mb-6 text-white">La Solution</h2>
						<p className="text-lg text-aura-muted leading-relaxed">{project.solution}</p>
					</RevealOnScroll>

					<RevealOnScroll>
						<h3 className="text-xl font-serif mb-4 text-white">Technologies Clés</h3>
						<div className="flex flex-wrap gap-4">
							{project.stack.map((tech) => (
								<div
									key={tech.name}
									className="flex items-center gap-3 px-4 py-3 bg-aura-card rounded-xl border border-aura-surface"
								>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img src={tech.icon} alt={tech.name} className="w-6 h-6" />
									<span className="font-medium text-sm">{tech.name}</span>
								</div>
							))}
						</div>
					</RevealOnScroll>
				</div>

				{/* Sidebar */}
				<div className="md:col-span-12 lg:col-span-4 rounded-[32px]">
					<div className="sticky top-32 space-y-8">
						<RevealOnScroll
							className="bg-aura-card p-8 rounded-[32px] border border-aura-surface"
							delay={200}
						>
							<h3 className="text-xl font-serif mb-8 text-white flex items-center gap-2">
								<span className="material-symbols-outlined text-aura-accent">monitoring</span>
								Impact Business
							</h3>
							<div className="space-y-8">
								{project.results.map((res) => (
									<div key={res.label}>
										<div className="flex items-center gap-2 text-aura-muted text-sm mb-1">
											<span className="material-symbols-outlined text-sm">{res.icon}</span>
											{res.label}
										</div>
										<div className="text-3xl font-serif text-white">{res.value}</div>
									</div>
								))}
							</div>
							<div className="mt-10 pt-8 border-t border-aura-surface">
								<Button href="/rendez-vous" variant="primary" fullWidth>
									Lancer un projet similaire
								</Button>
							</div>
						</RevealOnScroll>

						{project.testimonial && (
							<RevealOnScroll
								className="bg-aura-accent/5 p-8 rounded-[32px] border border-aura-accent/20"
								delay={400}
							>
								<span className="material-symbols-outlined text-4xl text-aura-accent mb-4 opacity-50">
									format_quote
								</span>
								<p className="text-lg italic text-white mb-6">
									&quot;{project.testimonial.quote}&quot;
								</p>
								<div>
									<div className="font-bold text-white">{project.testimonial.author}</div>
									<div className="text-sm text-aura-accent">{project.testimonial.role}</div>
								</div>
							</RevealOnScroll>
						)}
					</div>
				</div>
			</section>
		</div>
	);
}
