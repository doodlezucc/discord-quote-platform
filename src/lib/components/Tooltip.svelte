<script lang="ts">
	import { type Snippet } from 'svelte';
	import { BaseTetherTooltip, type Alignment } from 'svelte-tether';

	interface Props {
		keepVisible?: boolean;
		alignment?: Alignment;
		children: Snippet;
		tooltip?: string | Snippet;
	}

	let {
		keepVisible = false,
		alignment = 'top-center',
		children,
		tooltip: content
	}: Props = $props();
</script>

{#if content}
	<BaseTetherTooltip origin={alignment}>
		{@render children()}

		{#snippet tooltip({ tooltipId, isFocused, isHovered })}
			<div
				id={tooltipId}
				role="tooltip"
				class:show={keepVisible || isFocused || isHovered}
				aria-hidden="true"
			>
				{#if typeof content === 'string'}
					{content}
				{:else}
					{@render content()}
				{/if}
			</div>
		{/snippet}
	</BaseTetherTooltip>
{:else}
	{@render children()}
{/if}

<style lang="scss">
	@use '$lib/style/scheme';

	[role='tooltip'] {
		background-color: scheme.color('background');
		border: none;
		border-radius: 8px;
		padding: 4px 12px;
		font-size: 0.8rem;
		text-align: center;
		width: max-content;
		max-width: 300px;
		box-shadow: 0 2px 4px #000a;

		transition: 0.2s cubic-bezier(0.165, 0.84, 0.44, 1);
		opacity: 0;
		margin: 0;

		&.show {
			opacity: 1;
			margin: 2px;
		}
	}
</style>
