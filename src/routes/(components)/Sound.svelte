<script lang="ts">
	import type { GuildDataSoundSnippet } from '$lib/snippets';
	import InlineAudioPlayer from './InlineAudioPlayer.svelte';

	type Props = GuildDataSoundSnippet & {};

	let { name = $bindable(), mediaPath, keywords = $bindable() }: Props = $props();
</script>

<div class="sound">
	<span>{name}</span>

	<InlineAudioPlayer src={mediaPath} />
</div>

<style lang="scss">
	@use '$lib/style/scheme';

	.sound {
		display: grid;
		grid-template-columns: 30% 1fr;
		align-items: center;
	}
</style>
