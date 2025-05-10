import { building } from '$app/environment';
import { DISCORD_BOT_TOKEN } from '$env/static/private';
import { Client, Events, GatewayIntentBits, type Message } from 'discord.js';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import * as table from '../db/schema';
import { GuildState } from './guild-state';

// This is a workaround to clean up whenever hot-reloading bot relevant source code
// Ideally, you'd use import.meta.hot.dispose(...) from vite, but there are currently
// issues with SvelteKit: https://github.com/sveltejs/kit/issues/13359
declare const globalThis: {
	__discordClient?: Client;
};

if (globalThis.__discordClient) {
	globalThis.__discordClient.destroy();
}

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildVoiceStates
	]
});

if (!building) {
	globalThis.__discordClient = client;
}

export class Bot {
	readonly guildStates = new Map<string, GuildState>();

	constructor(readonly client: Client<true>) {}

	async initialize() {
		const dbRegisteredGuilds = await db.select({ id: table.guild.id }).from(table.guild);

		for (const guild of dbRegisteredGuilds) {
			await this.initializeGuildState(guild.id);
		}

		const registeredGuildIds = new Set(dbRegisteredGuilds.map((guild) => guild.id));
		const joinedGuildIds = new Set(await this.fetchAllJoinedGuildIds());

		const newlyJoinedGuildIds = joinedGuildIds.difference(registeredGuildIds);
		for (const joinedGuildId of newlyJoinedGuildIds) {
			await this.onAddedToGuild(joinedGuildId);
		}

		const newlyLeftGuildIds = registeredGuildIds.difference(joinedGuildIds);
		for (const leftGuildId of newlyLeftGuildIds) {
			await this.onRemovedFromGuild(leftGuildId);
		}
	}

	private async fetchAllJoinedGuildIds() {
		const PAGE_SIZE = 200;

		let pageResults = await client.guilds.fetch({ limit: PAGE_SIZE });
		let totalResults = pageResults;

		while (pageResults.size === PAGE_SIZE) {
			pageResults = await client.guilds.fetch({
				limit: PAGE_SIZE,
				after: totalResults.lastKey()
			});

			totalResults = totalResults.merge(
				pageResults,
				(guild) => ({ keep: true, value: guild }),
				(guild) => ({ keep: true, value: guild }),
				(guildInA) => ({ keep: true, value: guildInA })
			);
		}

		return totalResults.map((_, guildId) => guildId);
	}

	private async initializeGuildState(guildId: string) {
		const guild = await this.client.guilds.fetch(guildId);
		const guildMember = await guild.members.fetchMe();
		this.guildStates.set(guildId, new GuildState(guildId, guildMember));
	}

	private async forgetGuild(guildId: string) {
		const guildState = this.guildStates.get(guildId);

		if (guildState) {
			await guildState.data.delete();
			this.guildStates.delete(guildId);
		}
	}

	async onAddedToGuild(guildId: string) {
		console.log('Added to a guild');
		await db.insert(table.guild).values({ id: guildId });

		await this.initializeGuildState(guildId);
	}

	async onRemovedFromGuild(guildId: string) {
		console.log('Removed from a guild');
		await db.delete(table.guild).where(eq(table.guild.id, guildId));

		this.guildStates.delete(guildId);
		// this.forgetGuild(guildId);
	}
}

export const bot = new Promise<Bot>((resolve) => {
	client.once(Events.ClientReady, async (client) => {
		console.log('Logged in as', client.user.tag);

		const bot = new Bot(client);
		await bot.initialize();

		resolve(bot);
	});
});

client.on(Events.GuildCreate, async (guild) => {
	const guildRow = await db.query.guild.findFirst({
		columns: { id: true },
		where: eq(table.guild.id, guild.id)
	});

	if (guildRow === undefined) {
		(await bot).onAddedToGuild(guild.id);
	}
});

client.on(Events.GuildDelete, async (guild) => {
	const guildRow = await db.query.guild.findFirst({
		columns: { id: true },
		where: eq(table.guild.id, guild.id)
	});

	if (guildRow !== undefined) {
		(await bot).onRemovedFromGuild(guild.id);
	}
});

client.on(Events.MessageCreate, async (message) => {
	const guildMessage = message as Message<true>;
	(await bot).guildStates.get(guildMessage.guildId)?.processMessage(guildMessage);
});

if (!building) {
	client.login(DISCORD_BOT_TOKEN);
}
