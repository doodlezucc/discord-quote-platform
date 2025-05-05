<script lang="ts">
	import IconButton from '$lib/components/IconButton.svelte';
	import TrashIcon from '@lucide/svelte/icons/trash';
	import KeywordChip from './KeywordChip.svelte';

	interface Props {
		name: string;
		soundCount: number;
		onclick: () => void;
		handleDelete: () => Promise<void>;
	}

	let { name, soundCount, onclick, handleDelete }: Props = $props();

	let container = $state<HTMLElement>();

	function onClickButton(ev: MouseEvent) {
		if (ev.target === container) {
			onclick();
		}
	}

	function onClickDelete() {
		if (soundCount === 0) {
			handleDelete();
		}
	}
</script>

<button onclick={onClickButton} class:prevent-delete={soundCount > 0} bind:this={container}>
	<span>{name}</span>

	<KeywordChip>{soundCount}</KeywordChip>

	<div class="delete-icon">
		<IconButton icon={TrashIcon} stroke onclick={onClickDelete}>
			{soundCount > 0 ? "Can't delete non-empty command" : 'Delete'}
		</IconButton>
	</div>
</button>

<style lang="scss">
	@use '$lib/style/components';
	@use '$lib/style/scheme';

	button {
		@extend %outlined-button;

		display: grid;
		grid-template-columns: 1fr max-content max-content;
		text-align: start;
		padding-right: 8px;

		.delete-icon {
			color: scheme.color('primary');
		}

		&.prevent-delete .delete-icon {
			color: scheme.color('shade-4');
		}
	}

	span {
		pointer-events: none;
	}
</style>
