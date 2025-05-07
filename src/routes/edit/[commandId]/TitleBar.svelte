<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import TrashIcon from '@lucide/svelte/icons/trash';

	interface Props {
		title: string;
		guildName: string;
	}

	let { title = $bindable(), guildName }: Props = $props();

	let isEditingTitle = $state(false);
	let editingTitle = $state(title);
	let titleInput = $state<Input>();

	function onClickEdit() {
		isEditingTitle = true;
		titleInput!.focus();
	}

	function onClickSaveEdit() {
		isEditingTitle = false;
	}

	function discardEdits() {
		isEditingTitle = false;
		editingTitle = title;
	}

	function deleteCommand() {
		isEditingTitle = false;
	}
</script>

<div class="title" class:editing={isEditingTitle}>
	<a class="back-button" href="/">
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
			<Button icon={TrashIcon} iconStroke iconColor="primary" outline onclick={deleteCommand}>
				Remove from Server
			</Button>
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
		margin-top: 0.2em;
	}

	.title-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}
</style>
