<script lang="ts">
	import { page } from '$app/state';
	import Button from './Button.svelte';

	let isRendezVousPage = $derived(page.url.pathname === '/rendez-vous');
</script>

<footer class="{isRendezVousPage ? 'pt-8 pb-16 md:pb-24' : 'py-14 md:py-24'} relative overflow-hidden text-center">
    {#if !isRendezVousPage}
        <div class="absolute inset-0 bg-gradient-to-b from-transparent to-[#080d0c]/50"></div>
    {/if}
    <div class="max-w-3xl mx-auto px-6 relative z-10 space-y-8">
        {#if !isRendezVousPage}
            <h2 class="text-5xl md:text-6xl font-serif">
                Votre transformation <br />commence <span class="italic-accent">ici</span>.
            </h2>
            <p class="text-aura-muted text-lg">
                Mon accompagnement est conçu pour garantir un niveau d'excellence absolu dans chaque projet. 
                Vérifions ensemble si nous sommes faits pour collaborer.
            </p>
            <div class="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <Button href="/rendez-vous" variant="primary">
                    Réserver un audit gratuit
                </Button>
                <Button href="mailto:eliott.bouquerel@gmail.com" variant="secondary">
                    Me contacter par email
                </Button>
            </div>
        {/if}

        <div
            class="{isRendezVousPage ? 'pt-8' : 'pt-20'} text-xs text-aura-muted flex flex-col md:flex-row justify-center gap-8"
        >
            <span>&copy; {new Date().getFullYear()} Eliott Bouquerel</span>
            <a href="/mentions-legales" class="hover:text-white transition-colors">Mentions Légales</a>
            <a href="/cgv" class="hover:text-white transition-colors">CGV</a>
        </div>
    </div>
</footer>
