<script lang="ts">
	import { cookieConsent } from '$lib/stores/cookies';
	import { fade, fly } from 'svelte/transition';

	let visible = $derived($cookieConsent === 'pending');
</script>

{#if visible}
	<div
		class="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6"
		in:fly={{ y: 100, duration: 400, delay: 500 }}
		out:fade={{ duration: 200 }}
	>
		<div
			class="mx-auto max-w-3xl rounded-[24px] border border-aura-surface bg-aura-card/95 backdrop-blur-xl p-4 md:p-5 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.5)]"
		>
			<!-- Desktop: Horizontal layout -->
			<div class="hidden md:flex items-center gap-6">
				<!-- Icon + Text -->
				<div class="flex items-start gap-4 flex-1">
					<span class="text-3xl mt-0.5" aria-hidden="true">🍪</span>
					<div>
						<h3 class="font-serif text-lg text-white mb-1">Cookies & Confidentialit&eacute;</h3>
						<p class="text-aura-muted text-sm leading-relaxed">
							Ce site utilise des cookies d'analyse pour am&eacute;liorer votre exp&eacute;rience.
							<a href="/mentions-legales#cookies" class="text-aura-accent hover:underline">
								En savoir plus
							</a>
						</p>
					</div>
				</div>

				<!-- Buttons -->
				<div class="flex items-center gap-3 shrink-0">
					<button
						onclick={() => cookieConsent.reject()}
						class="px-6 py-3 rounded-full border border-aura-surface text-white hover:bg-aura-surface transition-all duration-300 text-sm font-medium"
					>
						Refuser
					</button>
					<button
						onclick={() => cookieConsent.accept()}
						class="px-6 py-3 rounded-full bg-aura-accent text-aura-bg hover:bg-white transition-all duration-300 text-sm font-bold shadow-[0_0_20px_rgba(111,240,211,0.2)] hover:shadow-[0_0_30px_rgba(111,240,211,0.4)]"
					>
						Accepter
					</button>
				</div>
			</div>

			<!-- Mobile: Vertical layout -->
			<div class="md:hidden">
				<!-- Icon + Title -->
				<div class="flex items-center gap-3 mb-3">
					<span class="text-2xl" aria-hidden="true">🍪</span>
					<h3 class="font-serif text-lg text-white">Cookies</h3>
				</div>

				<!-- Description -->
				<p class="text-aura-muted text-sm leading-relaxed mb-4">
					Ce site utilise des cookies d'analyse pour am&eacute;liorer votre exp&eacute;rience.
					<a href="/mentions-legales#cookies" class="text-aura-accent hover:underline">
						En savoir plus
					</a>
				</p>

				<!-- Buttons -->
				<div class="flex gap-3">
					<button
						onclick={() => cookieConsent.reject()}
						class="flex-1 px-4 py-3 rounded-full border border-aura-surface text-white hover:bg-aura-surface transition-all duration-300 text-sm font-medium"
					>
						Refuser
					</button>
					<button
						onclick={() => cookieConsent.accept()}
						class="flex-1 px-4 py-3 rounded-full bg-aura-accent text-aura-bg hover:bg-white transition-all duration-300 text-sm font-bold shadow-[0_0_20px_rgba(111,240,211,0.2)]"
					>
						Accepter
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
