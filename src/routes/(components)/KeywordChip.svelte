<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<div>
	{@render children()}
</div>

<style lang="scss">
	@use '$lib/style/scheme';

	div {
		background-color: scheme.color('shade-1');
		border: 1px solid scheme.color('separator');
		align-content: center;
		white-space: nowrap;
		font-size: 14px;
		padding: 1px 10px;
		border-radius: 100vw;
	}
</style>
