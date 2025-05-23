<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Chip from '$lib/components/Chip.svelte';
	import { useErrorDialogs } from '$lib/components/ErrorDialogWrapper.svelte';
	import IconButton from '$lib/components/IconButton.svelte';
	import Input from '$lib/components/Input.svelte';
	import type { GuildDataSoundPatch, GuildDataSoundSnippetWithOwner } from '$lib/snippets';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import TrashIcon from '@lucide/svelte/icons/trash';
	import UserLockIcon from '@lucide/svelte/icons/user-lock';
	import InlineAudioPlayer from './InlineAudioPlayer.svelte';
	import UserAvatar from './UserAvatar.svelte';

	type Props = GuildDataSoundSnippetWithOwner & {
		isEditable: boolean;
		handlePatch: (patch: GuildDataSoundPatch) => Promise<void>;
		handleDelete: () => void;
	};

	let {
		createdBy,
		isEditable,
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

	const { showErrorDialog } = useErrorDialogs();

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
			isExpanded = false;

			await handlePatch({
				name: editingName,
				keywords: editingKeywords
			});
		} catch (err) {
			isExpanded = true;
			showErrorDialog({ message: `Failed to save changes. ${err}` });
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

<div
	class="sound"
	class:editable={isEditable}
	aria-label="Sound"
	aria-expanded={isExpanded}
	bind:this={container}
>
	<div class="overview">
		<InlineAudioPlayer src={mediaPath} />

		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="summary" onmousedown={isEditable ? expand : undefined} bind:this={summary}>
			<Input
				name="sound-name"
				placeholder="Name..."
				type="text"
				bind:value={editingName}
				bind:this={nameInput}
				readonly={!isExpanded}
			/>

			<div class="keywords" role="list" aria-label="Keywords">
				{#each separateKeywords as keyword, index (`${keyword}${index}`)}
					<Chip>{keyword}</Chip>
				{/each}
			</div>

			{#if !isExpanded}
				<div class="access-icon">
					{#if isEditable}
						<IconButton icon={PencilIcon} stroke onclick={expand}>Edit</IconButton>
					{:else}
						<IconButton icon={UserLockIcon} stroke>No Access</IconButton>
					{/if}
				</div>

				<UserAvatar {...createdBy} />
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
		border: 1px solid scheme.color('separator');
		border-radius: 12px;
		transition: background-color 0.2s;

		&[aria-expanded='false'] {
			.summary > :global(*) {
				pointer-events: none;
			}

			&.editable {
				.summary {
					cursor: pointer;
				}

				&:has(.summary:hover) {
					background-color: scheme.color('shade-1');
					transition-duration: 0.1s;
				}
			}
		}

		&[aria-expanded='true'] {
			border-color: transparent;
			outline: 2px dashed scheme.color('shade-4');
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

	.access-icon {
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
