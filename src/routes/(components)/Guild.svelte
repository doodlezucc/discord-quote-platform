<script lang="ts">
	import { PUBLIC_DISCORD_CLIENT_ID } from '$env/static/public';
	import Button from '$lib/components/Button.svelte';
	import FileButton from '$lib/components/FileButton.svelte';
	import { rest } from '$lib/rest';
	import type {
		GuildDataCommandSnippetPopulated,
		GuildDataSoundPatch,
		GuildDataSoundSnippet,
		UserGuildSnippet
	} from '$lib/snippets';
	import Sound from './Sound.svelte';

	type Props = UserGuildSnippet;

	let { id, name, iconId, guildData = $bindable() }: Props = $props();

	let focusedCommand = $state<GuildDataCommandSnippetPopulated>();

	async function createCommand() {
		const createdCommand = await rest.guildCommandPost(id, 'new-command');
		guildData!.commands.push(createdCommand);
	}

	async function createNewSoundFromFile(file: File) {
		const createdSound = await rest.guildCommandSoundPost(id, focusedCommand!.id, file);
		focusedCommand!.sounds.push(createdSound);
	}

	async function patchSound(sound: GuildDataSoundSnippet, patch: GuildDataSoundPatch) {
		const soundIndex = focusedCommand!.sounds.indexOf(sound);
		const updatedSound = await rest.guildCommandSoundPatch(id, focusedCommand!.id, sound.id, patch);

		focusedCommand!.sounds[soundIndex] = { ...sound, ...updatedSound };
	}

	async function deleteSound(sound: GuildDataSoundSnippet) {
		await rest.guildCommandSoundDelete(id, focusedCommand!.id, sound.id);

		focusedCommand!.sounds = focusedCommand!.sounds.filter((someSound) => someSound !== sound);
	}

	function getMemberSnippet(userId: string) {
		return guildData!.members.find((snippet) => snippet.id === userId)!;
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
					<Button buttonProps={{ tabindex: -1 }}>Invite Clipbot</Button>
				</a>
			</div>
		{/if}
	</div>

	{#if guildData}
		{#if !focusedCommand}
			<div class="sounds">
				{#each guildData.commands as command (command.id)}
					<Button outline onclick={() => (focusedCommand = command)}>{command.name}</Button>
				{/each}
			</div>

			<div class="actions">
				<Button onclick={createCommand}>Add Command</Button>
			</div>
		{:else}
			<div class="sounds">
				{#each focusedCommand.sounds as sound (sound.id)}
					<Sound
						{...sound}
						bind:name={sound.name}
						bind:keywords={sound.keywords}
						owner={getMemberSnippet(sound.createdBy)}
						handlePatch={(patch) => patchSound(sound, patch)}
						handleDelete={() => deleteSound(sound)}
					/>
				{/each}
			</div>

			<div class="actions">
				<FileButton onPickFile={createNewSoundFromFile}>Add Sound</FileButton>
			</div>
		{/if}
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

	.align-right {
		margin-left: auto;
	}

	.sounds {
		border-top: 1px solid scheme.color('separator');
		display: flex;
		flex-direction: column;
		gap: 8px;
		overflow-y: auto;
	}

	.guild .actions {
		display: flex;
		align-items: center;
		justify-content: end;
		padding-top: 0;
	}
</style>
