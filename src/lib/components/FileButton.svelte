<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		onPickFile: (file: File) => void;
		children: Snippet;
	}

	let { onPickFile, children }: Props = $props();

	let files = $state<FileList>();
	let pickedFile = $derived(files ? files.item(0) : null);

	$effect(() => {
		if (pickedFile) {
			onPickFile(pickedFile);
		}
	});
</script>

<label class="button">
	{@render children()}

	<input type="file" bind:files />
</label>

<style lang="scss">
	@use '$lib/style/components';

	input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}

	label {
		@extend %button;
		display: inline-block;

		&:has(:focus-visible) {
			outline: 2px solid white;
		}
	}
</style>
