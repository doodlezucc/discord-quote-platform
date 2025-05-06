<script lang="ts">
	import Content from '$lib/components/Content.svelte';
	import Header from '$lib/components/Header.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Header userInfo={{ username: data.username }} />

<Content>
	<h1>{data.command.name}</h1>
</Content>
