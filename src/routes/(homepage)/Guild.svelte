<script lang="ts">
	import { goto } from '$app/navigation';
	import { PUBLIC_DISCORD_CLIENT_ID } from '$env/static/public';
	import Button from '$lib/components/Button.svelte';
	import { rest } from '$lib/rest';
	import type { UserGuildSnippet } from '$lib/snippets';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import CommandFolder from './CommandFolder.svelte';
	import NewCommand from './NewCommand.svelte';

	type Props = UserGuildSnippet;

	let { id, name, iconId, guildData = $bindable() }: Props = $props();

	async function createCommand(name: string) {
		const createdCommand = await rest.guildCommandPost(id, name);
		guildData!.commands.push({ ...createdCommand, soundCount: 0 });
		return createdCommand;
	}

	let isTypingNewCommand = $state(false);
	let newCommandName = $state('');

	async function onSubmitNewCommand() {
		const command = await createCommand(newCommandName);

		newCommandName = '';
		isTypingNewCommand = false;

		goto(`/edit/${command.id}`);
	}
</script>

<div class="guild">
	<div class="header">
		{#if iconId}
			<img
				class="icon"
				src="https://cdn.discordapp.com/icons/{id}/{iconId}.png"
				alt="Server Icon"
			/>
		{:else}
			<div class="icon placeholder"></div>
		{/if}

		<b>{name}</b>

		{#if !guildData}
			<div class="align-right">
				<a
					href="https://discord.com/oauth2/authorize?client_id={PUBLIC_DISCORD_CLIENT_ID}"
					target="_blank"
					rel="noopener noreferrer"
				>
					<Button buttonProps={{ tabindex: -1 }}>Invite Clipbot</Button>
				</a>
			</div>
		{/if}
	</div>

	{#if guildData}
		<div class="commands">
			{#each guildData.commands as command (command.id)}
				<CommandFolder commandId={command.id} name={command.name} soundCount={command.soundCount} />
			{/each}

			{#if isTypingNewCommand}
				<NewCommand
					bind:name={newCommandName}
					onSubmit={onSubmitNewCommand}
					onCancel={() => (isTypingNewCommand = false)}
				/>
			{:else}
				<Button outline icon={PlusIcon} onclick={() => (isTypingNewCommand = true)}>
					Add Command
				</Button>
			{/if}
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$lib/style/scheme';

	.guild {
		background-color: scheme.color('shade-1');
		border-radius: 16px;
		cursor: default;

		transition-duration: 0.3s;

		&:hover {
			background-color: scheme.color('shade-2');
			transition-duration: 0.05s;
		}
	}

	.guild > div {
		padding: 12px;
	}

	.header {
		display: grid;
		grid-template-columns: max-content 1fr max-content;
		gap: 8px;
		align-items: center;
	}

	.icon {
		width: 40px;
		height: 40px;
		border-radius: 8px;
	}

	.placeholder {
		border: 2px dashed scheme.color('separator');
	}

	.align-right {
		margin-left: auto;
	}

	.commands {
		border-top: 1px solid scheme.color('separator');
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 8px;
	}
</style>
