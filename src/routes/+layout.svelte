<script lang="ts">
	import '$lib/style/index.scss';
	import '@fontsource-variable/public-sans';
	import type { Snippet } from 'svelte';
	import { PortalOverlay } from 'svelte-tether';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<PortalOverlay>
	{@render children()}
</PortalOverlay>
