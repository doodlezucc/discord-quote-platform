import { DISCORD_BOT_TOKEN } from '$env/static/private';
import { Client, Events, GatewayIntentBits, type Guild, type Message } from 'discord.js';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import * as table from '../db/schema';
import { GuildState } from './guild-state';

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildVoiceStates
	]
});

export class Bot {
	readonly guildStates = new Map<string, GuildState>();

	constructor(readonly client: Client<true>) {
		this.initialize();
	}

	private async initialize() {
		const allJoinedGuilds = await db.select({ id: table.guild.id }).from(table.guild);

		for (const guild of allJoinedGuilds) {
			this.initializeGuildState(guild.id);
		}
	}

	private initializeGuildState(guildId: string) {
		this.guildStates.set(guildId, new GuildState(guildId));
	}

	private async forgetGuild(guildId: string) {
		const guildState = this.guildStates.get(guildId);

		if (guildState) {
			await guildState.data.delete();
			this.guildStates.delete(guildId);
		}
	}

	async onAddedToGuild(guild: Guild) {
		console.log('Added to a guild');
		await db.insert(table.guild).values({ id: guild.id });

		this.initializeGuildState(guild.id);
	}

	async onRemovedFromGuild(guild: Guild) {
		console.log('Removed from a guild');
		await db.delete(table.guild).where(eq(table.guild.id, guild.id));

		// this.forgetGuild(guild.id);
	}
}

export const bot = new Promise<Bot>((resolve) => {
	client.once(Events.ClientReady, async (client) => {
		console.log('Logged in as', client.user.tag);
		const guilds = await client.guilds.fetch({});
		console.log(guilds.size, 'guilds');

		// TODO: Add newly joined guilds to database, remove kicked guilds

		resolve(new Bot(client));
	});
});

client.on(Events.GuildCreate, async (guild) => {
	const guildRow = await db.query.guild.findFirst({
		columns: { id: true },
		where: eq(table.guild.id, guild.id)
	});

	if (guildRow === undefined) {
		(await bot).onAddedToGuild(guild);
	}
});

client.on(Events.GuildDelete, async (guild) => {
	const guildRow = await db.query.guild.findFirst({
		columns: { id: true },
		where: eq(table.guild.id, guild.id)
	});

	if (guildRow !== undefined) {
		(await bot).onRemovedFromGuild(guild);
	}
});

client.on(Events.MessageCreate, async (message) => {
	const guildMessage = message as Message<true>;
	(await bot).guildStates.get(guildMessage.guildId)?.processMessage(guildMessage);
});

client.login(DISCORD_BOT_TOKEN);
