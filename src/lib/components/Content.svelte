<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<main class="content-margin">
	{@render children()}
</main>

<style lang="scss">
	main {
		padding: 48px 0;
	}
</style>
