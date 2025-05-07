<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = {
		name: string;
		placeholder: string;
		value: string;
		onSubmit?: (value: string) => void;
		readonly?: boolean;
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

	let {
		name,
		placeholder,
		value = $bindable(),
		onSubmit,
		readonly,
		type,
		multiline
	}: Props = $props();

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
		{name}
		{placeholder}
		{type}
		{readonly}
		tabindex={readonly ? -1 : undefined}
		bind:value
		bind:this={element}
		onkeydown={onKeyDown}
		onblur={submit}
	/>
{:else}
	<textarea
		{name}
		{placeholder}
		{readonly}
		tabindex={readonly ? -1 : undefined}
		bind:value
		bind:this={element}
		onkeydown={onKeyDown}
		onblur={submit}
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
		border-bottom: 1px solid scheme.color('separator');
		padding: 0;

		&:hover,
		&:focus {
			border-bottom-color: scheme.color('shade-4');
		}

		&:read-only {
			border-bottom-color: transparent;
			outline: transparent;
		}
	}

	textarea {
		resize: none;
		border: 1px solid scheme.color('separator');
		border-radius: 4px;
		padding: 4px 8px;
	}
</style>
