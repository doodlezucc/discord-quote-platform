<script lang="ts">
	import Content from '$lib/components/Content.svelte';
	import FileButton from '$lib/components/FileButton.svelte';
	import Header from '$lib/components/Header.svelte';
	import { rest } from '$lib/rest';
	import type { GuildDataSoundPatch, GuildDataSoundSnippetWithOwner } from '$lib/snippets';
	import type { PageData } from './$types';
	import Sound from './(components)/Sound.svelte';

	let { data }: { data: PageData } = $props();

	let guildId = $derived(data.command.guildId);
	let commandId = $derived(data.command.id);

	let sounds = $state(data.sounds);

	async function createNewSoundFromFile(file: File) {
		const createdSound = await rest.guildCommandSoundPost(guildId, commandId, file);
		sounds.push({ ...createdSound, createdBy: data.user });
	}

	async function patchSound(sound: GuildDataSoundSnippetWithOwner, patch: GuildDataSoundPatch) {
		const soundIndex = sounds.indexOf(sound);
		const updatedSound = await rest.guildCommandSoundPatch(guildId, commandId, sound.id, patch);

		sounds[soundIndex] = { ...sound, name: updatedSound.name, keywords: updatedSound.keywords };
	}

	async function deleteSound(sound: GuildDataSoundSnippetWithOwner) {
		await rest.guildCommandSoundDelete(guildId, commandId, sound.id);

		sounds = sounds.filter((someSound) => someSound !== sound);
	}
</script>

<Header userInfo={{ username: data.user.displayName }} />

<Content>
	<h1>{data.command.name}</h1>

	<div class="sounds">
		{#if sounds.length === 0}
			<span>Nah...</span>
		{/if}

		{#each sounds as sound (sound.id)}
			<Sound
				{...sound}
				bind:name={sound.name}
				bind:keywords={sound.keywords}
				handlePatch={(patch) => patchSound(sound, patch)}
				handleDelete={() => deleteSound(sound)}
			/>
		{/each}
	</div>

	<div class="actions">
		<FileButton onPickFile={createNewSoundFromFile}>Add Sound</FileButton>
	</div>
</Content>

<style lang="scss">
	.actions {
		display: flex;
		justify-content: end;
		padding-top: 0;
	}
</style>
