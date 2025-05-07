<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Portal } from 'svelte-tether';

	interface Props {
		open: boolean;
		title: string;
		children: Snippet;
	}

	let { open = $bindable(), title, children }: Props = $props();

	let backdrop = $state<HTMLElement>();

	function onClick(ev: MouseEvent) {
		if (ev.target === backdrop) {
			open = false;
		}
	}
</script>

<svelte:window onclick={open ? onClick : undefined} />

{#if open}
	<Portal modal>
		<div class="backdrop" bind:this={backdrop}>
			<div role="dialog">
				<h1>{title}</h1>

				<p>
					{@render children()}
				</p>
			</div>
		</div>
	</Portal>
{/if}

<style lang="scss">
	@use '$lib/style/scheme';

	.backdrop {
		position: fixed;
		z-index: 1;
		width: 100%;
		height: 100%;
		background-color: #0005;

		display: grid;
		place-content: center;
		pointer-events: all;
	}

	h1 {
		margin: 0;
		font-size: 1.75rem;
		border-bottom: 1px solid scheme.color('separator');
	}

	[role='dialog'] {
		background-color: scheme.color('background');
		color: scheme.color('text');
		border: 1px solid scheme.color('separator');
		border-radius: 24px;
		margin: auto;
		min-width: 400px;

		> * {
			padding: 12px 24px;
		}
	}
</style>
