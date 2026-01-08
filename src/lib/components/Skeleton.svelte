<script lang="ts">
	interface Props {
		width?: string;
		height?: string;
		variant?: 'text' | 'circular' | 'rectangular';
		className?: string;
	}

	let { width = '100%', height = '1rem', variant = 'text', className = '' }: Props = $props();
</script>

<div
	class="skeleton {variant} {className}"
	style:width
	style:height
></div>

<style>
	.skeleton {
		background-color: var(--color-aura-surface);
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
		opacity: 0.5;
	}

	.text {
		border-radius: 4px;
	}

	.circular {
		border-radius: 50%;
	}

	.rectangular {
		border-radius: 8px;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 0.3;
		}
		50% {
			opacity: 0.7;
		}
	}
</style>
