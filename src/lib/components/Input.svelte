<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = {
		placeholder: string;
		value: string;
		onSubmit?: (value: string) => void;
	} & (
		| {
				type: HTMLInputAttributes['type'];
				multiline?: false;
		  }
		| {
				type?: undefined;
				multiline: true;
		  }
	);

	let { placeholder, value = $bindable(), onSubmit, type, multiline }: Props = $props();

	let element = $state<HTMLInputElement | HTMLTextAreaElement>();

	function submit() {
		element!.blur();
		onSubmit?.(value);
	}

	function onKeyDown(ev: KeyboardEvent) {
		if (ev.key === 'Enter') {
			if (multiline && !ev.ctrlKey) return;

			ev.preventDefault();
			submit();
		}
	}

	export function focus() {
		element!.focus();
		element!.setSelectionRange(0, value.length, 'forward');
	}
</script>

{#if !multiline}
	<input
		{placeholder}
		{type}
		bind:value
		bind:this={element}
		onkeydown={onKeyDown}
		onblur={submit}
	/>
{:else}
	<textarea {placeholder} bind:value bind:this={element} onkeydown={onKeyDown} onblur={submit}
	></textarea>
{/if}

<style lang="scss">
	@use '$lib/style/scheme';

	input,
	textarea {
		appearance: none;
		font: inherit;
		border: none;
		background-color: transparent;
	}

	input {
		min-width: 300px;
		margin-top: 1px;
		border-bottom: 1px solid transparent;
		padding: 0;

		&:hover,
		&:focus {
			border-bottom-color: scheme.color('separator');
		}
	}

	textarea {
		resize: none;
		border: 1px solid scheme.color('separator');
		border-radius: 4px;
		padding: 4px 8px;
	}
</style>
