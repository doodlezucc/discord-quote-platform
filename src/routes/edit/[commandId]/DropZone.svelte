<script lang="ts">
	import FileUpIcon from '@lucide/svelte/icons/file-up';
	import type { Snippet } from 'svelte';

	interface Props {
		onDrop: (files: File[]) => void;
		children: Snippet;
	}

	let { onDrop, children }: Props = $props();

	let isDragging = $state(false);
	let wrapper = $state<HTMLElement>();

	let wrapperRect = $state<DOMRect>();

	$effect(() => {
		if (wrapper) {
			wrapperRect = wrapper.getBoundingClientRect();
		}
	});

	function handleDrop(ev: DragEvent) {
		isDragging = false;
		ev.preventDefault();

		const files = ev.dataTransfer?.files;
		if (!files || files.length === 0) return;

		const allFiles = [...files];
		onDrop(allFiles);
	}
</script>

<svelte:window
	ondrop={handleDrop}
	ondragover={(ev) => ev.preventDefault()}
	ondragenter={() => (isDragging = true)}
	ondragleave={(ev) => {
		if (!ev.relatedTarget) {
			isDragging = false;
		}
	}}
/>

<div
	class="drop-zone"
	class:dragging={isDragging}
	aria-hidden={!isDragging}
	aria-live="assertive"
	style:--y-inset="{wrapperRect?.top}px"
>
	<FileUpIcon size={48} />
	<span>Drop files to upload.</span>
</div>

<div class="wrapper" bind:this={wrapper}>
	{@render children()}
</div>

<style lang="scss">
	@use '$lib/style/scheme';

	.wrapper {
		position: relative;
	}

	.drop-zone {
		position: fixed;
		z-index: 10;
		pointer-events: none;
		top: var(--y-inset);
		left: 0;
		right: 0;
		bottom: 0;

		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding-bottom: 1em;
		gap: 8px;
		font-size: 1.25em;
		border: 4px dashed scheme.color('primary');
		border-radius: 8px;
		background-color: #000a;

		transition: 0.2s cubic-bezier(0.165, 0.84, 0.44, 1);
		opacity: 0;
		margin: 4px;

		&.dragging {
			opacity: 1;
			margin: 16px;
		}
	}
</style>
