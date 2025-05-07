<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Content from '$lib/components/Content.svelte';
	import { useErrorDialogs } from '$lib/components/ErrorDialogWrapper.svelte';
	import FileButton from '$lib/components/FileButton.svelte';
	import Header from '$lib/components/Header.svelte';
	import { rest } from '$lib/rest';
	import type { GuildDataSoundPatch, GuildDataSoundSnippetWithOwner } from '$lib/snippets';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import { Tether } from 'svelte-tether';
	import type { PageData } from './$types';
	import Sound from './Sound.svelte';

	let { data }: { data: PageData } = $props();

	let guildId = $derived(data.command.guildId);
	let commandId = $derived(data.command.id);

	let sounds = $state(data.sounds);

	const { showErrorDialog } = useErrorDialogs();

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
		const soundIndex = sounds.indexOf(sound);
		sounds.splice(soundIndex, 1);

		try {
			await rest.guildCommandSoundDelete(guildId, commandId, sound.id);
		} catch (err) {
			// Re-insert sound
			sounds.splice(soundIndex, 0, sound);
			showErrorDialog({ message: `Failed to upload sound. ${err}` });
		}
	}
</script>

<Header userInfo={{ username: data.user.displayName }} />

<Content>
	<Tether origin="center-left">
		{#snippet portal()}
			<a class="back-button" href="/">
				<Button icon={ArrowLeftIcon} iconStroke outline buttonProps={{ tabindex: -1 }}>Back</Button>
			</a>
		{/snippet}

		<div class="title">
			<h2>{data.command.name}</h2>
			<p>A sound command in {data.command.guildName}</p>
		</div>
	</Tether>

	<div class="sounds">
		{#if sounds.length === 0}
			<p>No sounds have been added yet.</p>
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
	a {
		color: inherit;
	}

	.back-button {
		margin: 40px;
		pointer-events: all;
	}

	.actions {
		display: flex;
		justify-content: end;
		padding-top: 0;
	}

	.title {
		margin-top: 0.67em;
		margin-bottom: 1em;
		padding-bottom: 0.67em;
	}

	h2 {
		margin: 0;
	}

	.title p {
		line-height: 1;
		margin: 0;
	}

	.sounds {
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.actions {
		margin-top: 8px;
	}
</style>
