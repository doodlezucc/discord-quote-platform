<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<h1>Hello {data.user.username}!</h1>

{#each data.guilds as guild (guild.id)}
	<h2>{guild.name}</h2>
	<img src="https://cdn.discordapp.com/icons/{guild.id}/{guild.icon}.png" alt="Server Icon" />
{/each}
