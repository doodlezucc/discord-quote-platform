<script lang="ts">
	import Content from '$lib/components/Content.svelte';
	import { useErrorDialogs } from '$lib/components/ErrorDialogWrapper.svelte';
	import FileButton from '$lib/components/FileButton.svelte';
	import Header from '$lib/components/Header.svelte';
	import { rest } from '$lib/rest';
	import type {
		GuildDataCommandPatch,
		GuildDataSoundPatch,
		GuildDataSoundSnippetWithOwner
	} from '$lib/snippets';
	import type { PageData } from './$types';
	import DropZone from './DropZone.svelte';
	import Sound from './Sound.svelte';
	import TitleBar from './TitleBar.svelte';

	let { data }: { data: PageData } = $props();

	let guildId = $derived(data.command.guildId);
	let commandId = $derived(data.command.id);

	let commandName = $state(data.command.name);
	let sounds = $state(
		data.sounds.toSorted((a, b) => {
			const aIsEditable = a.createdBy.id === data.member.id;
			const bIsEditable = b.createdBy.id === data.member.id;

			return (bIsEditable ? 1 : 0) - (aIsEditable ? 1 : 0);
		})
	);

	const { showErrorDialog } = useErrorDialogs();

	async function patchCommand(patch: GuildDataCommandPatch) {
		const updatedCommand = await rest.guildCommandPatch(guildId, commandId, patch);
		commandName = updatedCommand.name;
	}

	async function deleteCommand() {
		await rest.guildCommandDelete(guildId, commandId);
	}

	async function createNewSoundFromFile(file: File) {
		try {
			const createdSound = await rest.guildCommandSoundPost(guildId, commandId, file);
			sounds.push({ ...createdSound, createdBy: data.member });
		} catch (err) {
			showErrorDialog({ message: `${err}` });
		}
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
			showErrorDialog({ message: `Failed to delete sound. ${err}` });
		}
	}

	async function onDropFiles(files: File[]) {
		for (const file of files) {
			await createNewSoundFromFile(file);
		}
	}
</script>

<svelte:head>
	<title>Edit {commandName} sounds</title>
</svelte:head>

<Header userInfo={{ username: data.username }} />

<DropZone onDrop={onDropFiles}>
	<Content>
		<TitleBar
			bind:title={commandName}
			guildName={data.command.guildName}
			soundCount={sounds.length}
			handleSave={patchCommand}
			handleDelete={deleteCommand}
		/>

		<div class="sounds">
			{#each sounds as sound (sound.id)}
				<Sound
					{...sound}
					bind:name={sound.name}
					bind:keywords={sound.keywords}
					isEditable={sound.createdBy.id === data.member.id}
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
</DropZone>

<style lang="scss">
	@use '$lib/style/scheme';

	.actions {
		display: flex;
		justify-content: end;
		padding-top: 0;
	}

	.sounds {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 1em;
	}

	.sounds .empty-note {
		text-align: center;
		padding: 8px;
		border: 2px dashed scheme.color('separator');
		border-radius: 8px;
		margin: 0;
	}
</style>
