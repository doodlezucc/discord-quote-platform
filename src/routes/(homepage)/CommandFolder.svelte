<script lang="ts">
	import { base } from '$app/paths';
	import Chip from '$lib/components/Chip.svelte';

	interface Props {
		commandId: string;
		name: string;
		soundCount: number;
	}

	let { commandId, name, soundCount }: Props = $props();
</script>

<a href={`${base}/edit/${commandId}`}>
	<span>{name}</span>

	<Chip>{soundCount}</Chip>
</a>

<style lang="scss">
	@use '$lib/style/components';
	@use '$lib/style/scheme';

	a {
		@extend %outlined-button;

		display: grid;
		grid-template-columns: 1fr max-content max-content;
		text-align: start;
		padding-right: 8px;
		text-decoration: none;

		&:hover,
		&:focus-visible {
			span {
				text-decoration: underline;
			}
		}
	}
</style>
