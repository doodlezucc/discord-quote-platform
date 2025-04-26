<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Content from '$lib/components/Content.svelte';
	import Header from '$lib/components/Header.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Header>
	{#snippet trailing()}
		<span>{data.user.username}</span>

		<form method="POST" action="?/logout">
			<Button type="submit">Log Out</Button>
		</form>
	{/snippet}
</Header>

<Content>
	{#each data.guilds as guild (guild.id)}
		<h2>{guild.name}</h2>
		<img src="https://cdn.discordapp.com/icons/{guild.id}/{guild.icon}.png" alt="Server Icon" />
	{/each}
</Content>
