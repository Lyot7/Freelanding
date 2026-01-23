<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let navScrolled = false;
	let isHidden = false;
	let lastScrollY = 0;
	let menuOpen = false;

	function toggleMenu() {
		menuOpen = !menuOpen;
		document.body.style.overflow = menuOpen ? 'hidden' : '';
	}

	function closeMenu() {
		menuOpen = false;
		document.body.style.overflow = '';
	}

	onMount(() => {
		const handleScroll = () => {
			const currentScrollY = window.scrollY;

			navScrolled = currentScrollY > 50;

			if (window.innerWidth < 1024) {
				if (currentScrollY > lastScrollY && currentScrollY > 100) {
					isHidden = true;
					closeMenu();
				} else {
					isHidden = false;
				}
			} else {
				isHidden = false;
				closeMenu();
			}

			lastScrollY = currentScrollY;
		};
		window.addEventListener('scroll', handleScroll);
		return () => {
			window.removeEventListener('scroll', handleScroll);
			document.body.style.overflow = '';
		};
	});

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
            href="/"
            class="text-lg md:text-xl font-serif font-semibold tracking-tight text-white flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity whitespace-nowrap"
        >
            <img src="/logo.svg" alt="Eliott Bouquerel" class="h-4 md:h-6 w-auto object-contain" width="41" height="24" />
            <span class="hidden md:inline"><span class="font-serif italic">Eliott</span> <span class="italic-accent">BOUQUEREL</span></span>
        </a>

        <div class="hidden lg:flex items-center space-x-6 text-sm font-medium text-aura-muted">
            <a href={getLink('#expertise')} class="hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-aura-surface/30">Expertise</a>
            <a href={getLink('#simulator')} class="hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-aura-surface/30">Calculateur ROI</a>
            <a href={getLink('#projects')} class="hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-aura-surface/30">Projets</a>
            <a href={getLink('#skills')} class="hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-aura-surface/30">Compétences</a>
            <a href={getLink('#faq')} class="hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-aura-surface/30">FAQ</a>
        </div>

        <div class="flex items-center gap-3">
            <a
                href="/rendez-vous"
                class="bg-aura-accent text-aura-bg px-4 md:px-6 py-2 rounded-full font-semibold text-xs md:text-sm hover:bg-white transition-colors whitespace-nowrap"
            >
                Prendre RDV
            </a>

            <!-- Burger button (mobile/tablet) -->
            <button
                class="lg:hidden flex flex-col justify-center items-center w-8 h-8 gap-[5px] group"
                onclick={toggleMenu}
                aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                aria-expanded={menuOpen}
            >
                <span class="block w-5 h-[2px] bg-white rounded-full transition-all duration-300 {menuOpen ? 'rotate-45 translate-y-[7px]' : ''}"></span>
                <span class="block w-5 h-[2px] bg-white rounded-full transition-all duration-300 {menuOpen ? 'opacity-0' : ''}"></span>
                <span class="block w-5 h-[2px] bg-white rounded-full transition-all duration-300 {menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}"></span>
            </button>
        </div>
    </div>
</nav>

<!-- Mobile menu overlay -->
{#if menuOpen}
	<div
		class="fixed inset-0 z-40 bg-aura-bg/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8 animate-fade-in lg:hidden"
	>
		<a href={getLink('#expertise')} onclick={closeMenu} class="text-2xl font-serif text-aura-muted hover:text-white transition-colors">Expertise</a>
		<a href={getLink('#simulator')} onclick={closeMenu} class="text-2xl font-serif text-aura-muted hover:text-white transition-colors">Calculateur ROI</a>
		<a href={getLink('#projects')} onclick={closeMenu} class="text-2xl font-serif text-aura-muted hover:text-white transition-colors">Projets</a>
		<a href={getLink('#skills')} onclick={closeMenu} class="text-2xl font-serif text-aura-muted hover:text-white transition-colors">Compétences</a>
		<a href={getLink('#faq')} onclick={closeMenu} class="text-2xl font-serif text-aura-muted hover:text-white transition-colors">FAQ</a>
	</div>
{/if}

<style>
	@keyframes fade-in {
		from { opacity: 0; transform: translateY(-10px); }
		to { opacity: 1; transform: translateY(0); }
	}
	:global(.animate-fade-in) {
		animation: fade-in 0.25s ease-out;
	}
</style>
