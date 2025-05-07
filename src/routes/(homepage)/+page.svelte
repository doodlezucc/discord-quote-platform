<script lang="ts">
	import Content from '$lib/components/Content.svelte';
	import Header from '$lib/components/Header.svelte';
	import { rest } from '$lib/rest';
	import type { UserGuildSnippet } from '$lib/snippets';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import Guild from './Guild.svelte';

	let { data }: { data: PageData } = $props();

	let guilds = $state<UserGuildSnippet[]>([]);

	async function fetchGuilds() {
		guilds = await rest.guildsGet();
	}

	onMount(() => {
		fetchGuilds();
	});

	let botEnabledGuilds = $derived(guilds.filter((guild) => guild.guildData !== undefined));
	let botDisabledGuilds = $derived(guilds.filter((guild) => guild.guildData === undefined));
</script>

<svelte:head>
	<title>Clipbot</title>
</svelte:head>

<Header userInfo={{ username: data.username }} />

<Content>
	{#if botEnabledGuilds.length > 0}
		<h2>Servers</h2>

		<div class="guilds">
			{#each botEnabledGuilds as guild (guild.id)}
				<Guild {...guild} bind:guildData={guild.guildData} />
			{/each}
		</div>
	{/if}

	{#if botDisabledGuilds.length > 0}
		<h2>Unconfigured Servers</h2>

		<div class="guilds">
			{#each botDisabledGuilds as guild (guild.id)}
				<Guild {...guild} bind:guildData={guild.guildData} />
			{/each}
		</div>
	{/if}
</Content>

<style lang="scss">
	.guilds {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
</style>
