<script lang="ts">
	import BookingCalendar from '$lib/components/BookingCalendar.svelte';
	import { fade } from 'svelte/transition';
</script>

<svelte:head>
	<title>Prendre rendez-vous | Eliott Bouquerel</title>
	<meta name="description" content="Réservez un créneau pour discuter de votre projet Web / Mobile." />
</svelte:head>

<div
	class="relative w-full flex flex-col items-center pt-32 pb-0 px-4 md:px-6"
	in:fade={{ duration: 300 }}
>
	<!-- Background Elements -->
	<div
		class="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-aura-accent/5 rounded-full blur-[120px] pointer-events-none z-0"
	></div>
	<div
		class="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-aura-gold/5 rounded-full blur-[100px] pointer-events-none z-0"
	></div>

	<!-- Header Content -->
	<div class="w-full max-w-3xl mx-auto text-center mb-12 relative z-10">
		<div
			class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-aura-surface bg-aura-card/50 mb-6"
		>
			<span class="w-1.5 h-1.5 rounded-full bg-aura-accent animate-pulse"></span>
			<span class="text-xs uppercase tracking-widest text-aura-muted"
				>Premier échange gratuit</span
			>
		</div>

		<h1 class="font-display text-4xl md:text-5xl lg:text-5xl font-medium leading-tight mb-6">
			Discutons de <br />
			<span class="font-serif italic text-aura-accent">votre projet</span>
		</h1>

		<p class="text-lg text-aura-muted leading-relaxed max-w-xl mx-auto mb-8">
			30 minutes pour faire le point sur vos besoins et identifier les leviers de croissance pour
			votre activité.
		</p>
		
		<p class="text-xs text-aura-muted">
			Une question avant de réserver ? 
			<a href="mailto:eliott.bouquerel@gmail.com" class="text-aura-accent hover:underline decoration-aura-accent/50 underline-offset-4"
				>Envoyez-moi un email</a
			>
		</p>
	</div>

	<!-- Main Content: Calendar -->
	<div class="relative z-10 w-full max-w-4xl">
		<BookingCalendar calLink="eliott-bouquerel/30min" />
	</div>
</div>
