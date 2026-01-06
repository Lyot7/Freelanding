<script lang="ts">
	interface Props {
		href?: string;
		type?: 'submit' | 'button' | 'reset';
		variant?: 'primary' | 'secondary' | 'link';
		class?: string;
		children?: import('svelte').Snippet;
        target?: string;
        onclick?: () => void;
	}

	let { 
        href, 
        type = 'button', 
        variant = 'primary', 
        class: className = '', 
        children,
        target,
        onclick
    }: Props = $props();

	const baseClasses = "transition-all duration-300 font-medium rounded-full inline-flex items-center justify-center gap-2";
	
    const variantClasses = {
		primary: "bg-aura-accent text-aura-bg hover:bg-white px-8 py-4 font-bold shadow-[0_0_20px_rgba(111,240,211,0.2)] hover:shadow-[0_0_30px_rgba(111,240,211,0.4)] hover:scale-[1.02]",
		secondary: "border border-aura-surface text-white hover:bg-aura-surface px-8 py-4",
		link: "text-aura-muted hover:text-white text-sm tracking-uppercase px-2 py-1"
	};
</script>

{#if href}
	<a {href} class="{baseClasses} {variantClasses[variant]} {className}" {target} {onclick}>
		{@render children?.()}
	</a>
{:else}
	<button {type} class="{baseClasses} {variantClasses[variant]} {className}" {onclick}>
		{@render children?.()}
	</button>
{/if}
