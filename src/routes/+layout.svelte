<script lang="ts">
	import '$lib/style/index.scss';
	import '@fontsource-variable/public-sans';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

{@render children()}
