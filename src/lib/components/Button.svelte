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
	@use '$lib/style/components';

	button {
		@extend %button;
	}
</style>
