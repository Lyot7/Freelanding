<script lang="ts">
	function resetCookieConsent() {
		localStorage.removeItem('cookie-consent');
		location.reload();
	}
</script>

<svelte:head>
	<title>Mentions Légales - Eliott B.</title>
	<meta
		name="description"
		content="Mentions légales du site d'Eliott Bouquerel, Développeur Web & Manager de Projet Freelance."
	/>
	
</svelte:head>

<!-- Main Content -->
	<main class="pt-32 pb-24 min-h-screen px-6">
		<div class="max-w-4xl mx-auto">
			<h1 class="text-4xl md:text-5xl font-serif mb-8">Mentions Légales</h1>
			<div class="w-24 h-1 bg-aura-accent mb-12 rounded-full opacity-50"></div>

			<div class="space-y-8 text-aura-muted leading-relaxed">
				<section>
					<h2 class="text-2xl font-serif text-white mb-4">1. Éditeur du site</h2>
					<p>
						Le site <strong class="text-white">eliottbouquerel.fr</strong> est édité par :
					</p>
					<div class="mt-4 pl-4 border-l-2 border-aura-surface">
						<p class="text-white font-medium">Eliott Bouquerel</p>
						<p>Développeur Web & Manager de Projet Freelance</p>
						<p>Spécialités : Architecture Web, Intégration IA, Automatisation</p>
						<p>Localisation : Caen, Normandie, France</p>
					</div>
				</section>

				<section>
					<h2 class="text-2xl font-serif text-white mb-4">2. Hébergement</h2>
					<p>
						Le site est hébergé par un prestataire externe. Pour toute question concernant
						l'hébergement, veuillez nous contacter.
					</p>
				</section>

				<section>
					<h2 class="text-2xl font-serif text-white mb-4">3. Propriété intellectuelle</h2>
					<p>
						L'ensemble du contenu de ce site (textes, images, logos, graphismes) est la propriété
						exclusive d'Eliott Bouquerel, sauf mention contraire. Toute reproduction, même
						partielle, est interdite sans autorisation préalable.
					</p>
				</section>

				<section>
					<h2 class="text-2xl font-serif text-white mb-4">4. Protection des données personnelles</h2>
					<p>
						Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez
						d'un droit d'accès, de rectification, de suppression et d'opposition aux données vous
						concernant. Pour exercer ces droits, contactez-nous à l'adresse email indiquée sur le
						site.
					</p>
				</section>

				<section id="cookies">
					<h2 class="text-2xl font-serif text-white mb-4">5. Cookies</h2>
					<p class="mb-4">
						Ce site utilise des cookies d'analyse pour comprendre comment les visiteurs interagissent
						avec le contenu. Vous pouvez accepter ou refuser ces cookies via la bannière de consentement.
					</p>

					<div class="mt-4 pl-4 border-l-2 border-aura-surface space-y-3">
						<div>
							<p class="text-white font-medium">Cookie d'analyse (PostHog)</p>
							<p class="text-sm">
								Nom : <code class="bg-aura-surface px-2 py-0.5 rounded">ph_*_posthog</code>
							</p>
							<p class="text-sm">Durée : 1 an</p>
							<p class="text-sm">
								Finalité : Mesure d'audience anonymisée (pages vues, durée de session)
							</p>
						</div>
					</div>

					<p class="mt-4">
						<strong class="text-white">Modifier votre choix :</strong> Pour réinitialiser vos
						préférences de cookies, vous pouvez
						<button
							onclick={resetCookieConsent}
							class="text-aura-accent hover:underline"
						>
							cliquer ici
						</button>
						pour afficher à nouveau la bannière de consentement.
					</p>
				</section>

				<section>
					<h2 class="text-2xl font-serif text-white mb-4">6. Responsabilité</h2>
					<p>
						Eliott Bouquerel ne pourra être tenu responsable des dommages directs ou indirects
						causés au matériel de l'utilisateur lors de l'accès au site, et résultant soit de
						l'utilisation d'un matériel ne répondant pas aux spécifications, soit de l'apparition
						d'un bug ou d'une incompatibilité.
					</p>
				</section>

				<section>
					<h2 class="text-2xl font-serif text-white mb-4">7. Contact</h2>
					<p>
						Pour toute question concernant ces mentions légales, vous pouvez nous contacter par
						email à l'adresse indiquée sur le site.
					</p>
				</section>
			</div>

			<div class="mt-16 pt-8 border-t border-aura-surface">
				<a
					href="/"
					class="inline-flex items-center gap-2 text-aura-accent hover:text-white transition-colors"
				>
					<span class="material-symbols-outlined text-sm">arrow_back</span>
					Retour à l'accueil
				</a>
			</div>
		</div>
	</main>

