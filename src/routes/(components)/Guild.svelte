<script lang="ts">
	import { PUBLIC_DISCORD_CLIENT_ID } from '$env/static/public';
	import Button from '$lib/components/Button.svelte';
	import FileButton from '$lib/components/FileButton.svelte';
	import { rest } from '$lib/rest';
	import type { UserGuildSnippet } from '$lib/snippets';

	type Props = UserGuildSnippet;

	let { id, name, iconId, guildData = $bindable() }: Props = $props();

	async function createNewSoundFromFile(file: File) {
		if (!guildData) return;

		const createdSound = await rest.postGuildSound(id, file);
		guildData.sounds.push(createdSound);
	}
</script>

<div class="guild">
	<div class="header">
		{#if iconId}
			<img
				class="icon"
				src="https://cdn.discordapp.com/icons/{id}/{iconId}.png"
				alt="Server Icon"
			/>
		{:else}
			<div class="icon placeholder"></div>
		{/if}
		<b>{name}</b>

		{#if !guildData}
			<div class="align-right">
				<a
					href="https://discord.com/oauth2/authorize?client_id={PUBLIC_DISCORD_CLIENT_ID}"
					target="_blank"
					rel="noopener noreferrer"
				>
					<Button>Add Clipbot</Button>
				</a>
			</div>
		{/if}
	</div>

	{#if guildData}
		<div class="content">
			<div class="sounds">
				{#each guildData.sounds as sound (sound.mediaPath)}
					<div class="sound">
						<span>{sound.name}</span>
						<audio src={sound.mediaPath} controls></audio>
					</div>
				{/each}
			</div>

			<div class="actions">
				<FileButton onPickFile={createNewSoundFromFile}>Add Sound</FileButton>
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$lib/style/scheme';

	.guild {
		background-color: scheme.color('shade-1');
		border-radius: 16px;
		cursor: default;

		transition-duration: 0.3s;

		&:hover {
			background-color: scheme.color('shade-2');
			transition-duration: 0.05s;
		}
	}

	.guild > div {
		padding: 12px;
	}

	.header {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.icon {
		width: 40px;
		height: 40px;
		border-radius: 8px;
	}

	.placeholder {
		border: 2px dashed scheme.color('separator');
	}

	.content {
		border-top: 1px solid scheme.color('separator');
	}

	.align-right {
		margin-left: auto;
	}
</style>
