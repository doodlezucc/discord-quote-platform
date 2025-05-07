<script lang="ts">
	import { type Snippet } from 'svelte';
	import { Tether, type Alignment } from 'svelte-tether';

	interface Props {
		keepVisible?: boolean;
		alignment?: Alignment;
		children: Snippet;
		tooltip?: string | Snippet;
	}

	let { keepVisible = false, alignment = 'top-center', children, tooltip }: Props = $props();

	let wrappedElement = $state<HTMLElement>();
	let tooltipId = $props.id();

	// This adds an identifying attribute to the "wrappedElement".
	// You can think of this as a Svelte use:action acting on the element.
	$effect(() => {
		const currentWrappedElement = wrappedElement;

		if (currentWrappedElement) {
			currentWrappedElement.setAttribute('aria-labelledby', tooltipId);

			return () => {
				currentWrappedElement.removeAttribute('aria-labelledby');
			};
		}
	});
</script>

{#if tooltip}
	<Tether origin={alignment} bind:wrappedElement>
		{@render children()}

		{#snippet portal()}
			<div aria-hidden="true" role="tooltip" id={tooltipId} class:show={keepVisible}>
				{#if typeof tooltip === 'string'}
					{tooltip}
				{:else}
					{@render tooltip()}
				{/if}
			</div>
		{/snippet}
	</Tether>
{:else}
	{@render children()}
{/if}

<!--
    The CSS selector here selects the tooltip element, if the wrapped element
    with the "aria-labelledby" attribute is currently hovered or focused.
-->
<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<style>
        #${tooltipId}.show, body:has(
            [aria-labelledby='${tooltipId}']:hover,
            [aria-labelledby='${tooltipId}']:focus-visible
        ) #${tooltipId} {
            opacity: 1;
            margin: 2px;
        }
    </style>`}
</svelte:head>

<style lang="scss">
	@use '$lib/style/scheme';

	[role='tooltip'] {
		margin: 0px;
		opacity: 0;
		transition: 0.2s cubic-bezier(0.165, 0.84, 0.44, 1);

		background-color: scheme.color('background');
		border: none;
		border-radius: 8px;
		padding: 4px 12px;
		font-size: 0.8rem;
		text-align: center;
		width: max-content;
		max-width: 300px;

		box-shadow: 0 2px 4px #000a;
	}
</style>
