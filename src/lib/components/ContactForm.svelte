<script lang="ts">
	import { fade } from 'svelte/transition';

	let name = $state('');
	let email = $state('');
	let message = $state('');

	let isLoading = $state(false);
	let success = $state(false);
	let error = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		isLoading = true;

		try {
			const response = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, email, message })
			});

			const data = await response.json();

			if (!response.ok) {
				error = data.error || "Une erreur s'est produite";
				return;
			}

			success = true;
			name = '';
			email = '';
			message = '';
		} catch {
			error = "Impossible d'envoyer le message. Veuillez réessayer.";
		} finally {
			isLoading = false;
		}
	}

	function resetForm() {
		success = false;
		error = '';
	}
</script>

<div class="w-full max-w-md mx-auto">
	{#if success}
		<div
			class="text-center p-8 rounded-2xl border border-aura-accent/30 bg-aura-card/50"
			in:fade={{ duration: 300 }}
		>
			<div class="w-12 h-12 mx-auto mb-4 rounded-full bg-aura-accent/20 flex items-center justify-center">
				<svg class="w-6 h-6 text-aura-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
			</div>
			<h3 class="text-xl font-medium text-aura-text mb-2">Message envoyé</h3>
			<p class="text-aura-muted mb-6">Je vous répondrai dans les plus brefs délais.</p>
			<button
				onclick={resetForm}
				class="text-sm text-aura-accent hover:text-aura-accent/80 transition-colors"
			>
				Envoyer un autre message
			</button>
		</div>
	{:else}
		<form onsubmit={handleSubmit} class="space-y-5" in:fade={{ duration: 300 }}>
			{#if error}
				<div
					class="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm"
					in:fade={{ duration: 200 }}
				>
					{error}
				</div>
			{/if}

			<div>
				<label for="name" class="block text-sm text-aura-muted mb-2">Nom</label>
				<input
					type="text"
					id="name"
					bind:value={name}
					required
					minlength="2"
					disabled={isLoading}
					class="w-full px-4 py-3 rounded-xl border border-aura-surface bg-aura-card/50 text-aura-text placeholder-aura-muted/50 focus:outline-none focus:border-aura-accent/50 transition-colors disabled:opacity-50"
					placeholder="Votre nom"
				/>
			</div>

			<div>
				<label for="email" class="block text-sm text-aura-muted mb-2">Email</label>
				<input
					type="email"
					id="email"
					bind:value={email}
					required
					disabled={isLoading}
					class="w-full px-4 py-3 rounded-xl border border-aura-surface bg-aura-card/50 text-aura-text placeholder-aura-muted/50 focus:outline-none focus:border-aura-accent/50 transition-colors disabled:opacity-50"
					placeholder="votre@email.com"
				/>
			</div>

			<div>
				<label for="message" class="block text-sm text-aura-muted mb-2">Message</label>
				<textarea
					id="message"
					bind:value={message}
					required
					minlength="10"
					rows="4"
					disabled={isLoading}
					class="w-full px-4 py-3 rounded-xl border border-aura-surface bg-aura-card/50 text-aura-text placeholder-aura-muted/50 focus:outline-none focus:border-aura-accent/50 transition-colors resize-none disabled:opacity-50"
					placeholder="Décrivez votre projet..."
				></textarea>
			</div>

			<button
				type="submit"
				disabled={isLoading}
				class="w-full px-6 py-3 rounded-xl bg-aura-accent text-aura-bg font-medium hover:bg-aura-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
			>
				{#if isLoading}
					<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					Envoi en cours...
				{:else}
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
					</svg>
					Envoyer le message
				{/if}
			</button>
		</form>
	{/if}
</div>
