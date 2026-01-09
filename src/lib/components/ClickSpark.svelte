<script lang="ts">
	/**
	 * ClickSpark.svelte
	 * Adds a "spark" animation on every click.
	 */

	let sparks = $state<{ id: number; x: number; y: number }[]>([]);
	let uid = 0;

	const sparkColor = '#6FF0D3'; // aura-accent
	const sparkSize = 10;
	const sparkRadius = 15;
	const sparkCount = 8;
	const duration = 400;

	function handleClick(e: MouseEvent) {
		const id = uid++;
		sparks = [...sparks, { id, x: e.clientX, y: e.clientY }];

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
					class="absolute bg-aura-accent rounded-full animate-spark origin-center"
					style="
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
        background-color: var(--color-aura-accent);
	}
</style>
