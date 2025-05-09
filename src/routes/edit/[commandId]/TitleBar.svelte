<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import Button from '$lib/components/Button.svelte';
	import { useErrorDialogs } from '$lib/components/ErrorDialogWrapper.svelte';
	import Input from '$lib/components/Input.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import type { GuildDataCommandPatch } from '$lib/snippets';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import TrashIcon from '@lucide/svelte/icons/trash';

	interface Props {
		title: string;
		guildName: string;
		soundCount: number;
		handleSave: (patch: GuildDataCommandPatch) => Promise<void>;
		handleDelete: () => Promise<void>;
	}

	let { title = $bindable(), guildName, soundCount, handleSave, handleDelete }: Props = $props();

	let isEditingTitle = $state(false);
	let editingTitle = $state(title);
	let titleInput = $state<Input>();

	const { showErrorDialog } = useErrorDialogs();

	function onClickEdit() {
		isEditingTitle = true;
		titleInput!.focus();
	}

	async function onClickSaveEdit() {
		try {
			isEditingTitle = false;
			await handleSave({ name: editingTitle });
		} catch (err) {
			isEditingTitle = true;
			showErrorDialog({ message: `Failed to save changes. ${err}` });
		}
	}

	function discardEdits() {
		isEditingTitle = false;
		editingTitle = title;
	}

	let isDeleting = $state(false);
	async function deleteCommand() {
		isDeleting = true;
		try {
			await handleDelete();
			await goto(`${base}/`);
		} catch (err) {
			showErrorDialog({ message: `Failed to delete command. ${err}` });
		} finally {
			isDeleting = false;
		}
	}

	let canDelete = $derived(soundCount === 0 && !isDeleting);
</script>

<div class="title" class:editing={isEditingTitle}>
	<a class="back-button" href="{base}/">
		<Button icon={ArrowLeftIcon} iconStroke outline buttonProps={{ tabindex: -1 }}>Guilds</Button>
	</a>

	<div>
		<h2>
			<Input
				bind:value={editingTitle}
				name="command-name"
				placeholder="Command name..."
				type="text"
				readonly={!isEditingTitle}
				bind:this={titleInput}
			/>
		</h2>
		<p>A sound command in {guildName}</p>
	</div>

	<div class="title-actions">
		{#if !isEditingTitle}
			<Button icon={SettingsIcon} iconStroke outline onclick={onClickEdit}>Edit Command</Button>
		{:else}
			<Tooltip
				tooltip={soundCount > 0
					? 'All sounds must be deleted before removing a command.'
					: undefined}
			>
				<Button
					icon={TrashIcon}
					iconStroke
					iconColor="primary"
					outline
					onclick={deleteCommand}
					disabled={!canDelete}
				>
					Remove from Server
				</Button>
			</Tooltip>

			<Button outline onclick={discardEdits}>Cancel</Button>
			<Button onclick={onClickSaveEdit}>Save</Button>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$lib/style/scheme';

	a {
		color: inherit;
	}

	.back-button {
		position: absolute;
		right: 100%;
		margin: 0 40px;
	}

	.title {
		position: relative;
		margin: 0.67em 0;
		outline: 2px dashed transparent;
		outline-offset: 16px;
		transition: 0.15s;

		display: grid;
		align-items: center;
		grid-template-columns: 1fr max-content;

		p {
			margin: 0;
			margin-bottom: 0.8em;
		}

		&.editing {
			outline-color: scheme.color('shade-4');
			border-radius: 2px;
			margin-bottom: 2em;
		}
	}

	h2 {
		margin: 0;
		line-height: 1;
		margin-top: 0.5em;
	}

	.title-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}
</style>
