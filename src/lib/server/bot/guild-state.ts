import type { GuildMember, Message } from 'discord.js';
import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import * as table from '../db/schema';
import { GuildData } from '../guild-data';
import { CommandRunner } from './command-runner';

export class GuildState {
	readonly data: GuildData;

	constructor(
		readonly id: string,
		readonly member: GuildMember
	) {
		this.data = new GuildData(this);
	}

	async processMessage(message: Message<true>) {
		if (message.member!.user.bot) return;

		const content = message.cleanContent;
		const [commandName, query = undefined] = content.split(/\s+/gm, 2);

		const [command = undefined] = await db
			.select({ id: table.command.id })
			.from(table.command)
			.where(and(eq(table.command.guildId, this.id), eq(table.command.name, commandName)));

		if (command) {
			const commandHandler = new CommandRunner(this, {
				sourceMessage: message,
				commandId: command.id,
				query
			});
			await commandHandler.handle();
		}
	}
}
