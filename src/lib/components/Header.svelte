<script lang="ts">
	import { base } from '$app/paths';
	import type { Snippet } from 'svelte';

	interface Props {
		trailing?: Snippet;
	}

	let { trailing }: Props = $props();
</script>

<header>
	<a href="{base}/"><h1>Clipbot</h1></a>

	{#if trailing}
		<div class="trailing">
			{@render trailing()}
		</div>
	{/if}
</header>

<style lang="scss">
	@use '$lib/style/scheme';

	header {
		position: sticky;
		top: 0;
		justify-content: space-between;
		padding: 12px 40px;
		background-color: scheme.color('background');
		border-bottom: 1px solid scheme.color('separator');
	}

	header,
	div {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	h1 {
		margin: 0;
		font-size: 1.2em;
	}
</style>
