<script lang="ts">
	import { base } from '$app/paths';
	import Button from './Button.svelte';

	interface Props {
		userInfo?: {
			username: string;
		};
	}

	let { userInfo }: Props = $props();
</script>

<header>
	<a href="{base}/"><h1>Clipbot</h1></a>

	{#if userInfo}
		<div class="trailing">
			<span aria-label="Logged in user">{userInfo.username}</span>

			<form method="POST" action="?/logout">
				<Button buttonProps={{ type: 'submit' }}>Log Out</Button>
			</form>
		</div>
	{/if}
</header>

<style lang="scss">
	@use '$lib/style/scheme';

	header {
		position: sticky;
		top: 0;
		z-index: 1;
		justify-content: space-between;
		padding: 12px 40px;
		background-color: scheme.color('background');
		border-bottom: 1px solid scheme.color('separator');
	}

	header,
	div {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	h1 {
		margin: 0;
		font-size: 1.2em;
	}
</style>
