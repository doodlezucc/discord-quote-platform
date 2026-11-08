<script lang="ts">
	import CircleXIcon from '@lucide/svelte/icons/circle-x';
	import SearchIcon from '@lucide/svelte/icons/search';
	import IconButton from './IconButton.svelte';

	type Props = {
		name: string;
		placeholder: string;
		query: string;
		onSubmit?: (value: string) => void;
	};

	let { name, placeholder, query: query = $bindable(), onSubmit }: Props = $props();

	let element = $state<HTMLInputElement | HTMLTextAreaElement>();

	function submit() {
		element!.blur();
		onSubmit?.(query);
	}

	function onKeyDown(ev: KeyboardEvent) {
		if (ev.key === 'Enter') {
			ev.preventDefault();
			submit();
		}
	}

	function clear() {
		query = '';
		element!.focus();
	}
</script>

<div class="search-bar">
	<div class="search-icon">
		<SearchIcon size={20} aria-hidden />
	</div>

	<input
		{name}
		{placeholder}
		bind:value={query}
		bind:this={element}
		onkeydown={onKeyDown}
		onblur={submit}
	/>

	<div class="clear-button" class:visible={query.length > 0}>
		<IconButton icon={CircleXIcon} stroke onclick={clear}>Clear</IconButton>
	</div>
</div>

<style lang="scss">
	@use '$lib/style/scheme';

	.search-bar {
		position: relative;
		display: flex;
		min-width: 300px;

		> div {
			position: absolute;
			align-self: center;
		}
	}

	.search-icon {
		margin-top: 6px;
		left: 12px;

		color: scheme.color('separator');
	}

	.clear-button {
		right: 4px;

		&:not(.visible) {
			opacity: 0;
			pointer-events: none;
		}
	}

	input {
		flex: 1;

		appearance: none;
		font: inherit;
		border: none;
		background-color: transparent;
		color: inherit;

		border: 1px solid scheme.color('separator');
		border-radius: 4px;
		padding: 4px 32px;
		padding-left: 40px;

		&:hover,
		&:focus {
			border-color: scheme.color('shade-4');
		}
	}
</style>
