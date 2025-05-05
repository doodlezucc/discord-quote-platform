<script lang="ts">
	import { PUBLIC_DISCORD_CLIENT_ID } from '$env/static/public';
	import Button from '$lib/components/Button.svelte';
	import FileButton from '$lib/components/FileButton.svelte';
	import Input from '$lib/components/Input.svelte';
	import { rest } from '$lib/rest';
	import type {
		GuildDataCommandSnippetPopulated,
		GuildDataSoundPatch,
		GuildDataSoundSnippet,
		UserGuildSnippet
	} from '$lib/snippets';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import CommandFolder from './CommandFolder.svelte';
	import Sound from './Sound.svelte';

	type Props = UserGuildSnippet;

	let { id, name, iconId, guildData = $bindable() }: Props = $props();

	let focusedCommand = $state<GuildDataCommandSnippetPopulated>();

	async function createCommand() {
		const createdCommand = await rest.guildCommandPost(id, 'new-command');
		guildData!.commands.push(createdCommand);
	}

	async function deleteCommand(command: GuildDataCommandSnippetPopulated) {
		await rest.guildCommandDelete(id, command.id);

		guildData!.commands = guildData!.commands.filter((someCommand) => someCommand !== command);
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

		<div class="title">
			{#if !focusedCommand}
				<b>{name}</b>
			{:else}
				<b>{name}</b>
				<span>></span>
				<Input
					bind:value={focusedCommand.name}
					name="command-name"
					placeholder="Command name..."
					type="text"
				/>
			{/if}
		</div>

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
			<div class="list commands">
				{#each guildData.commands as command (command.id)}
					<CommandFolder
						name={command.name}
						soundCount={command.sounds.length}
						onclick={() => (focusedCommand = command)}
						handleDelete={() => deleteCommand(command)}
					/>
				{/each}

				<Button outline icon={PlusIcon} onclick={createCommand}>Add Command</Button>
			</div>
		{:else}
			<div class="list sounds">
				{#if focusedCommand.sounds.length === 0}
					<span>Nah...</span>
				{/if}

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
				<Button outline onclick={() => (focusedCommand = undefined)}>Back</Button>
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
		display: grid;
		grid-template-columns: max-content 1fr max-content;
		gap: 8px;
		align-items: center;
	}

	.title {
		display: grid;
		grid-template-columns: auto auto 1fr;
		align-items: center;
		gap: 12px;
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

	.list {
		border-top: 1px solid scheme.color('separator');
		gap: 8px;
	}

	.commands {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
	}

	.sounds {
		display: flex;
		flex-direction: column;
	}

	.guild .actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 0;
	}
</style>
