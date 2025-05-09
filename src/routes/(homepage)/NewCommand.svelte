<script lang="ts">
	interface Props {
		name: string;
		onSubmit: () => void;
		onCancel: () => void;
	}

	let { name = $bindable(), onSubmit, onCancel }: Props = $props();

	let input = $state<HTMLInputElement>();

	$effect(() => {
		if (input) {
			input.focus();
		}
	});

	function onKeyDown(ev: KeyboardEvent) {
		if (ev.key === 'Enter') {
			ev.preventDefault();
			input!.blur();

			if (name.trim().length > 0) {
				onSubmit();
			} else {
				onCancel();
			}
		} else if (ev.key === 'Escape') {
			ev.preventDefault();
			onCancel();
		}
	}
</script>

<input
	bind:value={name}
	bind:this={input}
	name="new-command-name"
	placeholder="New command..."
	type="text"
	onkeydown={onKeyDown}
/>

<style lang="scss">
	@use '$lib/style/components';
	@use '$lib/style/scheme';

	input {
		@extend %outlined-button;
		cursor: text;
	}
</style>
