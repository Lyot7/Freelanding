import Image from 'next/image';
import { RevealOnScroll } from '@/components/animation/RevealOnScroll';

export function Testimonial() {
	return (
		<section className="py-16 md:py-24 bg-aura-card border-y border-aura-surface relative overflow-hidden">
			<RevealOnScroll className="max-w-4xl mx-auto px-6 text-center relative z-10">
				<span className="material-symbols-outlined text-6xl text-aura-accent mb-8 opacity-50">
					format_quote
				</span>
				<blockquote className="text-2xl md:text-4xl font-serif leading-tight mb-10 text-white">
					&quot;Eliott a repensé notre infrastructure e-commerce et nos outils internes. En seulement
					un an d&apos;alternance, il a transformé notre dette technique en une infrastructure
					scalable et performante,{' '}
					<span className="text-aura-accent italic">
						posant les bases d&apos;une croissance durable
					</span>
					.&quot;
				</blockquote>

				<div className="flex flex-col items-center justify-center gap-4">
					<Image
						src="/images/jerome-davy.png"
						alt="Jérôme DAVY"
						width={64}
						height={64}
						className="w-16 h-16 rounded-full object-cover border-2 border-aura-accent p-1"
					/>
					<div className="flex flex-col items-center gap-1">
						<div className="flex items-center gap-2">
							<span className="font-bold text-lg">Jérôme DAVY</span>
							<span className="material-symbols-outlined text-[18px] text-aura-accent">verified</span>
						</div>
						<div className="text-sm text-aura-muted">PDG de MECA SERVICES</div>
					</div>
				</div>
			</RevealOnScroll>
		</section>
	);
}
