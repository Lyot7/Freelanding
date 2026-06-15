import type { Metadata } from 'next';
import Link from 'next/link';
import { CookieResetButton } from './CookieResetButton';

export const metadata: Metadata = {
	title: 'Mentions Légales - Eliott B.',
	description:
		"Mentions légales du site d'Eliott Bouquerel, Développeur Web & Manager de Projet Freelance."
};

export default function MentionsLegalesPage() {
	return (
		<main className="pt-32 pb-24 min-h-screen px-6">
			<div className="max-w-4xl mx-auto">
				<h1 className="text-4xl md:text-5xl font-serif mb-8">Mentions Légales</h1>
				<div className="w-24 h-1 bg-aura-accent mb-12 rounded-full opacity-50"></div>

				<div className="space-y-8 text-aura-muted leading-relaxed">
					<section>
						<h2 className="text-2xl font-serif text-white mb-4">1. Éditeur du site</h2>
						<p>
							Le site <strong className="text-white">eliottbouquerel.fr</strong> est édité par :
						</p>
						<div className="mt-4 pl-4 border-l-2 border-aura-surface">
							<p className="text-white font-medium">Eliott Bouquerel</p>
							<p>Développeur Web &amp; Manager de Projet Freelance</p>
							<p>Spécialités : Architecture Web, Intégration IA, Automatisation</p>
							<p>Localisation : Caen, Normandie, France</p>
						</div>
					</section>

					<section>
						<h2 className="text-2xl font-serif text-white mb-4">2. Hébergement</h2>
						<p>
							Le site est hébergé par un prestataire externe. Pour toute question concernant
							l&apos;hébergement, veuillez nous contacter.
						</p>
					</section>

					<section>
						<h2 className="text-2xl font-serif text-white mb-4">3. Propriété intellectuelle</h2>
						<p>
							L&apos;ensemble du contenu de ce site (textes, images, logos, graphismes) est la
							propriété exclusive d&apos;Eliott Bouquerel, sauf mention contraire. Toute reproduction,
							même partielle, est interdite sans autorisation préalable.
						</p>
					</section>

					<section>
						<h2 className="text-2xl font-serif text-white mb-4">
							4. Protection des données personnelles
						</h2>
						<p>
							Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez
							d&apos;un droit d&apos;accès, de rectification, de suppression et d&apos;opposition aux
							données vous concernant. Pour exercer ces droits, contactez-nous à l&apos;adresse email
							indiquée sur le site.
						</p>
					</section>

					<section id="cookies" className="scroll-mt-32">
						<h2 className="text-2xl font-serif text-white mb-4">5. Cookies</h2>
						<p className="mb-4">
							Ce site utilise des cookies d&apos;analyse pour comprendre comment les visiteurs
							interagissent avec le contenu. Vous pouvez accepter ou refuser ces cookies via la
							bannière de consentement.
						</p>

						<div className="mt-4 pl-4 border-l-2 border-aura-surface space-y-3">
							<div>
								<p className="text-white font-medium">Cookie d&apos;analyse (PostHog)</p>
								<p className="text-sm">
									Nom :{' '}
									<code className="bg-aura-surface px-2 py-0.5 rounded">ph_*_posthog</code>
								</p>
								<p className="text-sm">Durée : 1 an</p>
								<p className="text-sm">
									Finalité : Mesure d&apos;audience anonymisée (pages vues, durée de session)
								</p>
							</div>
						</div>

						<p className="mt-4">
							<strong className="text-white">Modifier votre choix :</strong> Pour réinitialiser vos
							préférences de cookies, vous pouvez <CookieResetButton /> pour afficher à nouveau la
							bannière de consentement.
						</p>
					</section>

					<section>
						<h2 className="text-2xl font-serif text-white mb-4">6. Responsabilité</h2>
						<p>
							Eliott Bouquerel ne pourra être tenu responsable des dommages directs ou indirects
							causés au matériel de l&apos;utilisateur lors de l&apos;accès au site, et résultant soit
							de l&apos;utilisation d&apos;un matériel ne répondant pas aux spécifications, soit de
							l&apos;apparition d&apos;un bug ou d&apos;une incompatibilité.
						</p>
					</section>

					<section>
						<h2 className="text-2xl font-serif text-white mb-4">7. Contact</h2>
						<p>
							Pour toute question concernant ces mentions légales, vous pouvez nous contacter par
							email à l&apos;adresse indiquée sur le site.
						</p>
					</section>
				</div>

				<div className="mt-16 pt-8 border-t border-aura-surface">
					<Link
						href="/"
						className="inline-flex items-center gap-2 text-aura-accent hover:text-white transition-colors"
					>
						<span className="material-symbols-outlined text-sm">arrow_back</span>
						Retour à l&apos;accueil
					</Link>
				</div>
			</div>
		</main>
	);
}
