<script lang="ts">
	import type { Icon as IconType } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Tooltip from './Tooltip.svelte';

	interface Props {
		icon: typeof IconType;
		stroke?: boolean;

		onclick: (ev: MouseEvent) => void;
		children: Snippet;

		buttonProps?: Omit<HTMLButtonAttributes, 'children' | 'onclick'>;
	}

	let { buttonProps, icon: Icon, stroke = false, onclick, children }: Props = $props();
</script>

<Tooltip>
	<button {...buttonProps} {onclick}>
		<Icon size={20} fill={stroke ? 'transparent' : 'currentColor'} aria-hidden />
	</button>

	{#snippet tooltip()}
		{@render children()}
	{/snippet}
</Tooltip>

<style lang="scss">
	@use '$lib/style/components';
	@use '$lib/style/scheme';

	button {
		display: grid;
		place-content: center;
		background: none;
		color: inherit;
		padding: 4px;
		border: none;
		border-radius: 50%;
		width: 32px;
		height: 32px;
		cursor: pointer;

		background-color: transparent;
		opacity: 0.8;

		&:hover,
		&:focus-visible {
			opacity: 1;
		}
	}
</style>
