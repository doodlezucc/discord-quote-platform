<script lang="ts">
	import FileButton from '$lib/components/FileButton.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import type { GuildDataSoundPatch, GuildDataSoundSnippetWithOwner } from '$lib/snippets';
	import Fuse from 'fuse.js';
	import Sound from './Sound.svelte';

	interface Props {
		userMemberId: string;
		sounds: GuildDataSoundSnippetWithOwner[];
		handleCreateSound: (file: File) => Promise<void>;
		handlePatchSound: (
			sound: GuildDataSoundSnippetWithOwner,
			patch: GuildDataSoundPatch
		) => Promise<void>;
		handleDeleteSound: (sound: GuildDataSoundSnippetWithOwner) => Promise<void>;
	}

	let { userMemberId, sounds, handleCreateSound, handlePatchSound, handleDeleteSound }: Props =
		$props();

	let query = $state('');

	const fuseIndexForSounds = $derived(
		new Fuse(sounds, {
			keys: [{ name: 'name' }, { name: 'keywords' }],
			threshold: 0.1,
			ignoreLocation: true,
			useTokenSearch: true
		})
	);

	let filteredSounds = $derived.by(() => {
		const results = fuseIndexForSounds.search(query);

		return results.map((result) => result.item);
	});
</script>

<div class="actions">
	<SearchBar bind:query name="search-sounds" placeholder="Search..." />
	<FileButton onPickFile={handleCreateSound}>Upload</FileButton>
</div>

<div class="sounds">
	{#each filteredSounds as sound (sound.id)}
		<Sound
			{...sound}
			name={sound.name}
			keywords={sound.keywords}
			isEditable={sound.createdBy.id === userMemberId}
			handlePatch={(patch) => handlePatchSound(sound, patch)}
			handleDelete={() => handleDeleteSound(sound)}
		/>
	{:else}
		{#if sounds.length > 0}
			<p class="empty-note">No matching sounds found. Bummer!</p>
		{:else}
			<p class="empty-note">No sounds have been added yet.</p>
		{/if}
	{/each}
</div>

<style lang="scss">
	@use '$lib/style/scheme';

	.actions {
		display: grid;
		grid-template-columns: 1fr max-content;
		gap: 16px;
	}

	.sounds {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 16px;
		margin-bottom: 3em;
	}

	.sounds .empty-note {
		text-align: center;
		padding: 8px;
		border: 2px dashed scheme.color('separator');
		border-radius: 8px;
		margin: 0;
	}
</style>
