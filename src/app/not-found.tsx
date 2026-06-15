import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
			<p className="text-aura-accent text-sm uppercase tracking-widest mb-4">Erreur 404</p>
			<h1 className="text-5xl md:text-7xl font-serif mb-6">
				Page <span className="italic-accent">introuvable</span>
			</h1>
			<p className="text-aura-muted max-w-md mb-10">
				La page que vous cherchez n&apos;existe pas ou a été déplacée.
			</p>
			<Button href="/" variant="primary" magnetic>
				Retour à l&apos;accueil
			</Button>
			<Link href="/rendez-vous" className="mt-6 text-sm text-aura-muted hover:text-white transition-colors">
				Ou prendre rendez-vous →
			</Link>
		</div>
	);
}
