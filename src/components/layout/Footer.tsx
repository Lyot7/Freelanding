'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useFooterStore } from '@/store/footer';
import { Button } from '@/components/ui/Button';

export function Footer() {
	const pathname = usePathname();
	const isRendezVousPage = pathname === '/rendez-vous';
	const config = useFooterStore((s) => s.config);

	return (
		<footer className="py-14 md:py-24 relative overflow-hidden text-center">
			{!isRendezVousPage && (
				<div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#080d0c]/50" />
			)}
			<div className="max-w-3xl mx-auto px-6 relative z-10 space-y-8">
				{!isRendezVousPage && (
					<>
						<h2 className="text-4xl sm:text-5xl md:text-6xl font-serif">
							{config.title} <br />
							commence <span className="italic-accent">{config.titleAccent}</span>.
						</h2>
						<p className="text-aura-muted text-lg">{config.description}</p>
						<div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
							{config.primaryButton && (
								<Button href={config.primaryButton.href} variant="primary" magnetic>
									{config.primaryButton.label}
									{config.primaryButton.icon && (
										<span className="material-symbols-outlined ml-2 text-sm">
											{config.primaryButton.icon}
										</span>
									)}
								</Button>
							)}
							{config.secondaryButton && (
								<Button href={config.secondaryButton.href} variant="secondary">
									{config.secondaryButton.label}
									{config.secondaryButton.icon && (
										<span className="material-symbols-outlined text-sm">
											{config.secondaryButton.icon}
										</span>
									)}
								</Button>
							)}
						</div>
					</>
				)}

				<div
					className={cnFooter(isRendezVousPage)}
				>
					<span>&copy; {new Date().getFullYear()} Eliott Bouquerel</span>
					<div className="flex gap-6">
						<Link href="/mentions-legales" className="hover:text-white transition-colors">
							Mentions Légales
						</Link>
						<Link href="/cgv" className="hover:text-white transition-colors">
							CGV
						</Link>
					</div>
				</div>
			</div>
		</footer>
	);
}

function cnFooter(isRendezVous: boolean) {
	return [
		isRendezVous ? '' : 'pt-20',
		'text-xs text-aura-muted flex flex-col items-center gap-3 md:flex-row md:justify-center md:gap-8'
	].join(' ');
}
