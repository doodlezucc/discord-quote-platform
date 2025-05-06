<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<Header />

<main class="content-margin">
	{@render children()}
</main>

<style lang="scss">
	main {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		height: 100vh;
		display: grid;
		place-content: center;
	}
</style>
