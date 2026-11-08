<script lang="ts">
	import type { GuildDataSoundPatch, GuildDataSoundSnippetWithOwner } from '$lib/snippets';
	import Sound from './Sound.svelte';

	interface Props {
		userMemberId: string;
		sounds: GuildDataSoundSnippetWithOwner[];
		patchSound: (
			sound: GuildDataSoundSnippetWithOwner,
			patch: GuildDataSoundPatch
		) => Promise<void>;
		deleteSound: (sound: GuildDataSoundSnippetWithOwner) => Promise<void>;
	}

	let { userMemberId, sounds, patchSound, deleteSound }: Props = $props();
</script>

<div class="sounds">
	{#each sounds as sound (sound.id)}
		<Sound
			{...sound}
			name={sound.name}
			keywords={sound.keywords}
			isEditable={sound.createdBy.id === userMemberId}
			handlePatch={(patch) => patchSound(sound, patch)}
			handleDelete={() => deleteSound(sound)}
		/>
	{:else}
		<p class="empty-note">No sounds have been added yet.</p>
	{/each}
</div>

<style lang="scss">
	@use '$lib/style/scheme';

	.sounds {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 1em;
	}

	.sounds .empty-note {
		text-align: center;
		padding: 8px;
		border: 2px dashed scheme.color('separator');
		border-radius: 8px;
		margin: 0;
	}
</style>
