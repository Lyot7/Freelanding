<script lang="ts">
	import { page } from '$app/state';
	import { footerConfig } from '$lib/stores/footer';
	import Button from './Button.svelte';

	let isRendezVousPage = $derived(page.url.pathname === '/rendez-vous');

	// Subscribe to store
	let config = $state($footerConfig);
	$effect(() => {
		const unsubscribe = footerConfig.subscribe((value) => {
			config = value;
		});
		return unsubscribe;
	});
</script>

<footer
	class="{isRendezVousPage ? 'pt-8 pb-16 md:pb-24' : 'py-14 md:py-24'} relative overflow-hidden text-center"
>
	{#if !isRendezVousPage}
		<div class="absolute inset-0 bg-gradient-to-b from-transparent to-[#080d0c]/50"></div>
	{/if}
	<div class="max-w-3xl mx-auto px-6 relative z-10 space-y-8">
		{#if !isRendezVousPage}
			<h2 class="text-4xl sm:text-5xl md:text-6xl font-serif">
				{config.title} <br />commence <span class="italic-accent">{config.titleAccent}</span>.
			</h2>
			<p class="text-aura-muted text-lg">
				{config.description}
			</p>
			<div class="flex flex-col sm:flex-row justify-center gap-4 pt-4">
				{#if config.primaryButton}
					<Button href={config.primaryButton.href} variant="primary">
						{config.primaryButton.label}
						{#if config.primaryButton.icon}
							<span class="material-symbols-outlined ml-2 text-sm">{config.primaryButton.icon}</span>
						{/if}
					</Button>
				{/if}
				{#if config.secondaryButton}
					<Button href={config.secondaryButton.href} variant="secondary">
						{config.secondaryButton.label}
						{#if config.secondaryButton.icon}
							<span class="material-symbols-outlined text-sm">{config.secondaryButton.icon}</span>
						{/if}
					</Button>
				{/if}
			</div>
		{/if}

		<div
			class="{isRendezVousPage
				? 'pt-8'
				: 'pt-20'} text-xs text-aura-muted flex flex-col items-center gap-3 md:flex-row md:justify-center md:gap-8"
		>
			<span>&copy; {new Date().getFullYear()} Eliott Bouquerel</span>
			<div class="flex gap-6">
				<a href="/mentions-legales" class="hover:text-white transition-colors">Mentions Légales</a>
				<a href="/cgv" class="hover:text-white transition-colors">CGV</a>
			</div>
		</div>
	</div>
</footer>
