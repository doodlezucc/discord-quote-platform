<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import IconButton from '$lib/components/IconButton.svelte';
	import Input from '$lib/components/Input.svelte';
	import type {
		DiscordGuildMemberSnippet,
		GuildDataSoundPatch,
		GuildDataSoundSnippet
	} from '$lib/snippets';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import TrashIcon from '@lucide/svelte/icons/trash';
	import InlineAudioPlayer from './InlineAudioPlayer.svelte';
	import KeywordChip from './KeywordChip.svelte';
	import UserAvatar from './UserAvatar.svelte';

	type Props = GuildDataSoundSnippet & {
		owner: DiscordGuildMemberSnippet;
		handlePatch: (patch: GuildDataSoundPatch) => Promise<void>;
		handleDelete: () => void;
	};

	let {
		owner,
		handlePatch,
		handleDelete,
		name = $bindable(),
		mediaPath,
		keywords = $bindable()
	}: Props = $props();

	let editingName = $derived(name);
	let editingKeywords = $derived(keywords);

	let isExpanded = $state(false);

	let nameInput = $state<Input>();
	let container = $state<HTMLElement>();
	let summary = $state<HTMLElement>();

	function expand(ev: MouseEvent) {
		if (!isExpanded) {
			ev.preventDefault();
			isExpanded = !isExpanded;
			nameInput!.focus();
			container!.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}

	let isSaving = $state(false);

	async function saveChanges() {
		isSaving = true;

		try {
			await handlePatch({
				name: editingName,
				keywords: editingKeywords
			});

			isExpanded = false;
		} finally {
			isSaving = false;
		}
	}

	function discardChanges() {
		editingName = name;
		editingKeywords = keywords;
		isExpanded = false;

		const documentSelection = document.getSelection();

		if (documentSelection && documentSelection.anchorNode === summary) {
			documentSelection.empty();
		}
	}

	let separateKeywords = $derived(
		editingKeywords.split(/\s+/gm).filter((keyword) => keyword !== '')
	);
</script>

<div class="sound" aria-label="Sound" aria-expanded={isExpanded} bind:this={container}>
	<div class="overview">
		<InlineAudioPlayer src={mediaPath} />

		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="summary" onmousedown={expand} bind:this={summary}>
			<Input
				name="sound-name"
				placeholder="Name..."
				type="text"
				bind:value={editingName}
				bind:this={nameInput}
				readonly={!isExpanded}
			/>

			<div class="keywords" role="list" aria-label="Keywords">
				{#each separateKeywords as keyword}
					<KeywordChip>{keyword}</KeywordChip>
				{/each}
			</div>

			{#if !isExpanded}
				<div class="expand-icon">
					<IconButton icon={PencilIcon} stroke onclick={expand}>Edit</IconButton>
				</div>

				<UserAvatar {...owner} />
			{/if}
		</div>
	</div>

	<div class="details" inert={!isExpanded}>
		<Input name="sound-keywords" placeholder="Keywords..." multiline bind:value={editingKeywords} />

		<div class="actions">
			<Button onclick={handleDelete} outline icon={TrashIcon} iconStroke iconColor="primary">
				Delete
			</Button>
			<div class="expand"></div>
			<Button onclick={discardChanges} outline>Discard Changes</Button>
			<Button onclick={saveChanges} disabled={isSaving}>Save</Button>
		</div>
	</div>
</div>

<style lang="scss">
	@use '$lib/style/scheme';

	.sound {
		display: flex;
		flex-direction: column;
		background-color: scheme.color('background');
		border-radius: 12px;

		&[aria-expanded='false'] {
			.summary {
				cursor: pointer;
			}

			.summary > :global(*) {
				pointer-events: none;
			}

			&:has(.summary:hover) {
				background-color: scheme.color('shade-1');
			}
		}

		&[aria-expanded='true'] {
			outline: 2px dashed scheme.color('shade-4');

			.expand-icon {
				color: scheme.color('primary');
			}
		}
	}

	.overview {
		display: grid;
		padding-left: 12px;
		grid-template-columns: min(300px, 30vw) 1fr;
		align-items: center;
	}

	.summary {
		display: grid;
		grid-template-columns: 1fr minmax(auto, max-content) max-content max-content;
		padding: 12px;
	}

	.keywords {
		position: relative;
		display: flex;
		align-items: center;
		gap: 2px;
		overflow: hidden;
		justify-content: end;
		mask-image: linear-gradient(to right, #fff0 0px, #ffff 24px);

		:global(> :first-child) {
			margin-left: 24px;
		}
	}

	.expand-icon {
		padding: 0 8px;
	}

	.details {
		overflow: hidden;
		display: grid;
		grid-template-rows: 1fr max-content;
		gap: 12px;
		padding: 12px;
		padding-top: 0;
		transition: 0.2s cubic-bezier(0.165, 0.84, 0.44, 1);

		height: 200px;

		&[inert] {
			padding-top: 0;
			padding-bottom: 0;
			height: 0;
		}
	}

	.actions {
		display: flex;
		gap: 12px;
	}

	.expand {
		flex: 1;
	}
</style>
