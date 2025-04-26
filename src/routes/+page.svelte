<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Content from '$lib/components/Content.svelte';
	import Header from '$lib/components/Header.svelte';
	import type { PageData } from './$types';
	import Guild from './(components)/Guild.svelte';

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
	<h2>Servers</h2>

	<div class="guilds">
		{#each data.guilds as guild (guild.id)}
			<Guild id={guild.id} name={guild.name} iconId={guild.icon} content={null} />
		{/each}
	</div>
</Content>

<style lang="scss">
	.guilds {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
</style>
