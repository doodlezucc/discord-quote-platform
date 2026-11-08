<script lang="ts">
	import Content from '$lib/components/Content.svelte';
	import { useErrorDialogs } from '$lib/components/ErrorDialogWrapper.svelte';
	import Header from '$lib/components/Header.svelte';
	import { rest } from '$lib/rest';
	import type {
		GuildDataCommandPatch,
		GuildDataSoundPatch,
		GuildDataSoundSnippetWithOwner
	} from '$lib/snippets';
	import type { PageData } from './$types';
	import DropZone from './DropZone.svelte';
	import SoundList from './SoundList.svelte';
	import TitleBar from './TitleBar.svelte';

	let { data }: { data: PageData } = $props();

	let guildId = $derived(data.command.guildId);
	let commandId = $derived(data.command.id);

	// Only the INITIAL value of "data.command.name" is relevant here.
	// svelte-ignore state_referenced_locally
	let commandName = $state(data.command.name);

	// Only the INITIAL value of "data.sounds" is relevant here.
	// svelte-ignore state_referenced_locally
	let sounds = $state(data.sounds);

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
			sounds.unshift({ ...createdSound, createdBy: data.member });
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
			handleCreateSound={createNewSoundFromFile}
		/>

		<SoundList userMemberId={data.member.id} {sounds} {patchSound} {deleteSound} />
	</Content>
</DropZone>
