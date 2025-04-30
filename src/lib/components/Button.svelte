<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props {
		onclick?: () => void;
		children: Snippet;

		buttonProps?: Omit<HTMLButtonAttributes, 'onclick' | 'children'>;
	}

	let { onclick, children, buttonProps }: Props = $props();
</script>

<button {...buttonProps} {onclick}>
	{@render children()}
</button>

<style lang="scss">
	@use '$lib/style/components';

	button {
		@extend %button;
	}
</style>
