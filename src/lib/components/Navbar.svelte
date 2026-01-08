<script lang="ts">
	import { onMount } from 'svelte';
    import { page } from '$app/stores';

	let navScrolled = false;
	let isHidden = false;
	let lastScrollY = 0;

	onMount(() => {
		const handleScroll = () => {
			const currentScrollY = window.scrollY;
			
			// Handle background blur on scroll
			navScrolled = currentScrollY > 50;

			// Handle scroll hide/show for mobile/tablet (< 1024px)
			if (window.innerWidth < 1024) {
				if (currentScrollY > lastScrollY && currentScrollY > 100) {
					// Scrolling down & past threshold
					isHidden = true;
				} else {
					// Scrolling up
					isHidden = false;
				}
			} else {
				// Always show on desktop
				isHidden = false;
			}
			
			lastScrollY = currentScrollY;
		};
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	});

    // Helper to determine link href based on current page
    function getLink(anchor: string) {
        if ($page.url.pathname === '/') {
            return anchor;
        }
        return `/${anchor}`;
    }
</script>

<nav
    id="navbar"
    class="fixed top-0 left-0 right-0 w-full z-50 transition-all duration-500 px-6 md:px-12"
    class:pt-4={!navScrolled}
    class:md:pt-8={!navScrolled}
    class:py-4={navScrolled}
    class:-translate-y-full={isHidden}
>
    <div
        class="max-w-7xl mx-auto flex justify-between items-center bg-aura-bg/80 backdrop-blur-md rounded-full px-4 md:px-6 py-2.5 md:py-3 border border-aura-surface/50"
    >
        <a
            href={getLink('#top')}
            class="text-lg md:text-xl font-serif font-semibold tracking-tight text-white flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity whitespace-nowrap"
        >
            <img src="/favicon/favicon.svg" alt="Eliott Bouquerel" class="w-7 h-7 md:w-8 md:h-8 object-contain" />
            <span>Eliott <span class="italic-accent">BOUQUEREL</span></span>
        </a>

        <div class="hidden lg:flex items-center space-x-6 text-sm font-medium text-aura-muted">
            <a href={getLink('#expertise')} class="hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-aura-surface/30">Expertise</a>
            <a href={getLink('#simulator')} class="hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-aura-surface/30">Calculateur ROI</a>
            <a href={getLink('#projects')} class="hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-aura-surface/30">Projets</a>
            <a href={getLink('#skills')} class="hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-aura-surface/30">Compétences</a>
        </div>

        <a
            href="/rendez-vous"
            class="bg-aura-accent text-aura-bg px-4 md:px-6 py-2 rounded-full font-semibold text-xs md:text-sm hover:bg-white transition-colors whitespace-nowrap"
        >
            Prendre RDV
        </a>
    </div>
</nav>
