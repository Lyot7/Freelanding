<script lang="ts">
	import { onMount } from 'svelte';
    import { browser } from '$app/environment';

	interface Props {
		calLink?: string;
		config?: Record<string, any>;
	}

	let { calLink = 'eliott-bouquerel/30min', config = { layout: 'month_view' } } = $props();
    
    let calElement: HTMLElement;

	onMount(() => {
        if (!browser) return;
        
		(function (C: any, A, L) {
			let p = function (a: any, ar: any) {
				a.q.push(ar);
			};
			let d = C.document;
			C.Cal =
				C.Cal ||
				function () {
					let cal = C.Cal;
					let ar = arguments;
					if (!cal.loaded) {
						cal.ns = {};
						cal.q = cal.q || [];
						d.head.appendChild(d.createElement('script')).src = A;
						cal.loaded = true;
					}
					if (ar[0] === L) {
						const api: any = function () {
							p(api, arguments);
						};
						const namespace = ar[1];
						api.q = api.q || [];
						if (typeof namespace === 'string') {
							cal.ns[namespace] = cal.ns[namespace] || api;
							p(cal.ns[namespace], ar);
							p(cal, ['initNamespace', namespace]);
						} else p(cal, ar);
						return;
					}
					p(cal, ar);
				};
		})(window, 'https://app.cal.com/embed/embed.js', 'init');

		const Cal = (window as any).Cal;
		Cal('init', '30min', { origin: 'https://app.cal.com' });

		Cal.ns['30min']('inline', {
			elementOrSelector: calElement,
            calLink: calLink,
			config: config
		});

		Cal.ns['30min']('ui', config);

        // Robustly force scrolling="no" on the iframe
        const interval = setInterval(() => {
            if (calElement) {
                const iframe = calElement.querySelector('iframe');
                if (iframe) {
                    iframe.setAttribute('scrolling', 'no');
                    iframe.style.overflow = 'hidden';
                }
            }
        }, 500);

        // Stop checking after 5 seconds to save resources
        const timeout = setTimeout(() => {
            clearInterval(interval);
        }, 5000);

        return () => {
             window.removeEventListener('scroll', () => {}); 
             clearInterval(interval);
             clearTimeout(timeout);
        };
	});
</script>

<div class="calendar-container w-full">
	<div bind:this={calElement} class="w-full"></div>
</div>

<style>
    /* Custom scrollbar for the embed if needed */
    .calendar-container :global(iframe) {
        background-color: transparent !important;
        border: none !important;
        width: 100% !important;
        scrollbar-width: none !important; /* Firefox */
        -ms-overflow-style: none !important; /* IE/Edge */
    }
    
    .calendar-container :global(iframe::-webkit-scrollbar) {
        display: none !important; /* Chrome/Safari */
    }
</style>
