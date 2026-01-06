<script lang="ts">
	interface Props {
		title: string;
		subtitle?: string; // The italic colored part
        align?: 'center' | 'left';
	}

	let { title, subtitle, align = 'center' }: Props = $props();
</script>

<div class="mb-16 animate-fade-up {align === 'center' ? 'text-center' : 'text-left'}">
	<h2 class="text-4xl md:text-5xl font-serif mb-6">
		{title} {#if subtitle}<span class="italic-accent">{subtitle}</span>{/if}
	</h2>
    {#if align === 'center'}
	    <div class="w-24 h-1 bg-aura-accent mx-auto rounded-full opacity-50"></div>
    {:else}
        <div class="w-24 h-1 bg-aura-accent rounded-full opacity-50"></div>
    {/if}
</div>
