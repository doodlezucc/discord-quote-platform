<script lang="ts">
	import Tooltip from '$lib/components/Tooltip.svelte';
	import type { DiscordGuildMemberSnippet } from '$lib/snippets';

	type Props = DiscordGuildMemberSnippet;

	let { displayName, avatarUrl }: Props = $props();
</script>

<Tooltip>
	{#snippet tooltip()}
		Uploaded by {displayName}
	{/snippet}

	<img src={avatarUrl} alt="User avatar" />
</Tooltip>

<style lang="scss">
	img {
		pointer-events: all;
		width: 32px;
		height: 32px;
		border-radius: 50%;
	}
</style>
