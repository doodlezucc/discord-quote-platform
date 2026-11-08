<script lang="ts">
	import type { Icon as IconType } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		icon?: typeof IconType;
		outline?: boolean;
		onPickFile: (file: File) => void;
		children: Snippet;
	}

	let { icon: Icon, outline = false, onPickFile, children }: Props = $props();

	let files = $state<FileList>();
	let pickedFile = $derived(files ? files.item(0) : null);

	$effect(() => {
		if (pickedFile) {
			onPickFile(pickedFile);
		}
	});
</script>

<label class="button" class:outlined={outline}>
	{#if Icon}
		<Icon size={20} aria-hidden />
	{/if}

	{@render children()}

	<input type="file" bind:files />
</label>

<style lang="scss">
	@use '$lib/style/components';

	input {
		position: absolute;
		opacity: 0;
		width: 0;
		pointer-events: none;
	}

	label {
		@extend %button;

		&:has(:focus-visible) {
			outline: 2px solid white;
		}
	}
</style>
