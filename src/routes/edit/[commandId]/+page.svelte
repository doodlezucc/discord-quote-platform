<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Content from '$lib/components/Content.svelte';
	import { useErrorDialogs } from '$lib/components/ErrorDialogWrapper.svelte';
	import FileButton from '$lib/components/FileButton.svelte';
	import Header from '$lib/components/Header.svelte';
	import { rest } from '$lib/rest';
	import type { GuildDataSoundPatch, GuildDataSoundSnippetWithOwner } from '$lib/snippets';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import type { PageData } from './$types';
	import Sound from './Sound.svelte';

	let { data }: { data: PageData } = $props();

	let guildId = $derived(data.command.guildId);
	let commandId = $derived(data.command.id);

	let sounds = $state(data.sounds);

	const { showErrorDialog } = useErrorDialogs();

	async function createNewSoundFromFile(file: File) {
		const createdSound = await rest.guildCommandSoundPost(guildId, commandId, file);
		sounds.push({ ...createdSound, createdBy: data.member });
	}

	async function patchSound(sound: GuildDataSoundSnippetWithOwner, patch: GuildDataSoundPatch) {
		const soundIndex = sounds.indexOf(sound);
		const updatedSound = await rest.guildCommandSoundPatch(guildId, commandId, sound.id, patch);

		sounds[soundIndex] = { ...sound, name: updatedSound.name, keywords: updatedSound.keywords };
	}

	async function deleteSound(sound: GuildDataSoundSnippetWithOwner) {
		const soundIndex = sounds.indexOf(sound);
		sounds = sounds.toSpliced(soundIndex, 1);

		try {
			await rest.guildCommandSoundDelete(guildId, commandId, sound.id);
		} catch (err) {
			// Re-insert sound
			sounds = sounds.toSpliced(soundIndex, 0, sound);
			showErrorDialog({ message: `Failed to upload sound. ${err}` });
		}
	}
</script>

<svelte:head>
	<title>Edit {data.command.name} sounds</title>
</svelte:head>

<Header userInfo={{ username: data.username }} />

<Content>
	<div class="title">
		<a class="back-button" href="/">
			<Button icon={ArrowLeftIcon} iconStroke outline buttonProps={{ tabindex: -1 }}>Guilds</Button>
		</a>

		<h2>{data.command.name}</h2>
		<p>A sound command in {data.command.guildName}</p>
	</div>

	<div class="sounds">
		{#each sounds as sound (sound.id)}
			<Sound
				{...sound}
				bind:name={sound.name}
				bind:keywords={sound.keywords}
				handlePatch={(patch) => patchSound(sound, patch)}
				handleDelete={() => deleteSound(sound)}
			/>
		{:else}
			<p class="empty-note">No sounds have been added yet.</p>
		{/each}
	</div>

	<div class="actions">
		<FileButton onPickFile={createNewSoundFromFile}>Add Sound</FileButton>
	</div>
</Content>

<style lang="scss">
	@use '$lib/style/scheme';

	a {
		color: inherit;
	}

	.actions {
		display: flex;
		justify-content: end;
		padding-top: 0;
	}

	.title {
		position: relative;
		margin: 0.67em 0;
	}

	.back-button {
		position: absolute;
		right: 100%;
		margin: 0.9em 40px;
	}

	h2 {
		margin: 0;
	}

	.title p {
		line-height: 1;
		margin: 0;
	}

	.sounds {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin: 1em 0;
	}

	.actions {
		margin-top: 8px;
	}

	.sounds .empty-note {
		text-align: center;
		padding: 8px;
		border: 2px dashed scheme.color('separator');
		border-radius: 8px;
		margin: 0;
	}
</style>
