<script lang="ts">
	/**
	 * ClickSpark.svelte
	 * Adds a "spark" animation on every click.
	 */

	let sparks = $state<{ id: number; x: number; y: number; color: string }[]>([]);
	let uid = 0;

	const defaultColor = '#6FF0D3'; // aura-accent
    const contrastColor = '#0F1A18'; // aura-bg (dark)
	const sparkSize = 10;
	const sparkRadius = 15;
	const sparkCount = 8;
	const duration = 400;

	function handleClick(e: MouseEvent) {
        let color = defaultColor;

        // Check if we clicked on a green background
        if (e.target instanceof HTMLElement) {
            let el: HTMLElement | null = e.target;
            // Traverse up to find background color
            while (el && el !== document.body) {
                const style = window.getComputedStyle(el);
                const bg = style.backgroundColor;
                
                // Check for refined green match (rgba or hex)
                // aura-accent is #6FF0D3 -> rgb(111, 240, 211)
                if (bg === 'rgb(111, 240, 211)' || bg === '#6ff0d3' || bg === '#6FF0D3') {
                    color = contrastColor;
                    break;
                }
                
                // If element has opacity < 1 or bg is transparent, continue up
                if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && style.opacity !== '0') {
                    // We hit a solid background that is NOT green, stop
                    break;
                }
                
                el = el.parentElement;
            }
        }

		const id = uid++;
		sparks = [...sparks, { id, x: e.clientX, y: e.clientY, color }];

		setTimeout(() => {
			sparks = sparks.filter((s) => s.id !== id);
		}, duration);
	}
</script>

<svelte:window onclick={handleClick} />

<div class="pointer-events-none fixed inset-0 z-[9999] overflow-hidden" aria-hidden="true">
	{#each sparks as spark (spark.id)}
		<div class="absolute" style="left: {spark.x}px; top: {spark.y}px;">
			{#each { length: sparkCount } as _, i}
				<div
					class="absolute rounded-full animate-spark origin-center"
					style="
                        background-color: {spark.color};
                        width: {sparkSize}px; 
                        height: 2px;
                        left: -{sparkSize / 2}px;
                        top: -1px;
                        --angle: {(360 / sparkCount) * i}deg;
                        --radius: {sparkRadius}px;
                    "
				></div>
			{/each}
		</div>
	{/each}
</div>

<style>
	@keyframes spark-anim {
		0% {
			transform: rotate(var(--angle)) translateX(0) scale(1);
			opacity: 1;
		}
		100% {
			transform: rotate(var(--angle)) translateX(var(--radius)) scale(0);
			opacity: 0;
		}
	}

	.animate-spark {
		animation: spark-anim 400ms ease-out forwards;
	}
</style>
