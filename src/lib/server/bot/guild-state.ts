import type { GuildMember, Message } from 'discord.js';
import { GuildData } from '../guild-data';

export class GuildState {
	readonly data: GuildData;

	constructor(
		readonly id: string,
		readonly member: GuildMember
	) {
		this.data = new GuildData(this);
	}

	async processMessage(message: Message<true>) {
		const member = message.member!;

		console.log(member.displayName, message.cleanContent);
	}
}
