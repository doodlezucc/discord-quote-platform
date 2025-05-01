<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import IconButton from '$lib/components/IconButton.svelte';
	import Input from '$lib/components/Input.svelte';
	import type { GuildDataSoundSnippet } from '$lib/snippets';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import XIcon from '@lucide/svelte/icons/x';
	import InlineAudioPlayer from './InlineAudioPlayer.svelte';
	import KeywordChip from './KeywordChip.svelte';

	type Props = GuildDataSoundSnippet & {
		onRemove: () => void;
	};

	let { onRemove, name = $bindable(), mediaPath, keywords = $bindable() }: Props = $props();

	let isExpanded = $state(false);

	let nameInput = $state<Input>();
	let summary = $state<HTMLElement>();

	function onSummaryClick(ev: MouseEvent) {
		if (!isExpanded) {
			ev.preventDefault();
			isExpanded = !isExpanded;
			nameInput!.focus();
		}
	}

	let separateKeywords = $derived(keywords.split(/\s+/gm).filter((keyword) => keyword !== ''));
</script>

<div class="sound" aria-expanded={isExpanded}>
	<div class="overview">
		<InlineAudioPlayer src={mediaPath} />

		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="summary" onmousedown={onSummaryClick} bind:this={summary}>
			<Input placeholder="Name..." type="text" bind:value={name} bind:this={nameInput} />

			<div class="keywords">
				{#each separateKeywords as keyword}
					<KeywordChip>{keyword}</KeywordChip>
				{/each}
			</div>

			<div class="expand-icon">
				<IconButton icon={ChevronDownIcon} onclick={() => (isExpanded = !isExpanded)}>
					Collapse
				</IconButton>
			</div>
		</div>
	</div>

	<div class="details" aria-hidden={!isExpanded}>
		<Input placeholder="Keywords..." multiline bind:value={keywords} />

		<div class="actions">
			<Button onclick={onRemove} outline icon={XIcon} iconColor="primary">Delete</Button>
			<Button onclick={onRemove}>Save</Button>
		</div>
	</div>
</div>

<style lang="scss">
	@use '$lib/style/scheme';

	.sound {
		display: flex;
		flex-direction: column;
		background-color: scheme.color('background');
		border-radius: 12px;

		&[aria-expanded='false'] {
			.summary {
				cursor: pointer;
			}

			.summary > :global(*) {
				pointer-events: none;
			}

			&:has(.summary:hover) {
				background-color: scheme.color('shade-1');
			}
		}

		&[aria-expanded='true'] {
			.expand-icon {
				rotate: 180deg;
			}
		}
	}

	.overview {
		display: grid;
		padding-left: 12px;
		grid-template-columns: min(300px, 30vw) 1fr;
		align-items: center;
	}

	.summary {
		display: grid;
		grid-template-columns: 1fr minmax(auto, max-content) max-content;
		padding: 12px;
		padding-right: 0;
	}

	.keywords {
		position: relative;
		display: flex;
		align-items: center;
		gap: 2px;
		overflow: hidden;
		justify-content: end;
		mask-image: linear-gradient(to right, #fff0 0px, #ffff 24px);

		:global(> :first-child) {
			margin-left: 24px;
			font-weight: bold;
		}
	}

	.expand-icon {
		padding: 0 16px;
		transition: rotate 0.5s;
	}

	.details {
		overflow: hidden;
		display: grid;
		grid-template-columns: 1fr max-content;
		gap: 12px;
		padding: 12px;
		padding-top: 0;
		transition: 0.2s cubic-bezier(0.165, 0.84, 0.44, 1);

		&[aria-hidden='true'] {
			padding-top: 0;
			padding-bottom: 0;
			height: 0;
		}
		&[aria-hidden='false'] {
			height: 120px;
		}
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: 6px;
		justify-content: space-between;
	}
</style>
