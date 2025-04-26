<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		type?: HTMLButtonElement['type'];
		onclick?: () => void;
		children: Snippet;
	}

	let { type, onclick, children }: Props = $props();
</script>

<button {type} {onclick}>
	{@render children()}
</button>

<style lang="scss">
	@use '$lib/style/scheme';

	button {
		appearance: none;
		padding: 8px 16px;
		min-width: 100px;
		border: none;
		border-radius: 4px;
		font: inherit;
		font-size: 16px;
		cursor: pointer;
		color: scheme.color('on-primary');

		background-color: scheme.color('primary');
		transition: 0.15s;

		&:hover,
		&:focus-visible {
			background-color: scheme.color('primary', -1);
		}

		&:active {
			background-color: scheme.color('primary', -2);
			transition-duration: 0s;
		}
	}
</style>
