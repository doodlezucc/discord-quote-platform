<script lang="ts">
	import type { Icon as IconType } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props {
		icon?: typeof IconType;
		iconStroke?: boolean;
		iconColor?: 'primary' | 'text';
		outline?: boolean;

		onclick?: (ev: MouseEvent) => void;
		disabled?: boolean;
		children: Snippet;

		buttonProps?: Omit<HTMLButtonAttributes, 'onclick' | 'disabled' | 'children'>;
	}

	let {
		icon: Icon,
		iconStroke = false,
		iconColor = 'text',
		outline = false,
		onclick,
		disabled,
		children,
		buttonProps
	}: Props = $props();
</script>

<button {...buttonProps} {onclick} {disabled} class:outlined={outline}>
	{#if Icon}
		<span data-color={iconColor}>
			<Icon size={20} fill={iconStroke ? 'transparent' : 'currentColor'} aria-hidden />
		</span>
	{/if}

	{@render children()}
</button>

<style lang="scss">
	@use '$lib/style/components';
	@use '$lib/style/scheme';

	button {
		@extend %button;
	}

	span {
		display: flex;
	}

	span[data-color='primary'] {
		color: scheme.color('primary');
	}
</style>
