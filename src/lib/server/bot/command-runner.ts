import {
	AudioPlayerStatus,
	createAudioPlayer,
	createAudioResource,
	joinVoiceChannel
} from '@discordjs/voice';
import type { Message, VoiceBasedChannel } from 'discord.js';
import { eq } from 'drizzle-orm';
import { server } from '..';
import { db } from '../db';
import * as table from '../db/schema';
import type { GuildState } from './guild-state';

interface CommandContext {
	sourceMessage: Message<true>;
	commandId: string;
	query?: string;
}

export class CommandRunner {
	private readonly sourceMessage: Message<true>;
	private readonly commandId: string;
	private readonly query?: string;

	constructor(
		private readonly guildState: GuildState,
		context: CommandContext
	) {
		this.sourceMessage = context.sourceMessage;
		this.commandId = context.commandId;
		this.query = context.query;
	}

	async handle() {
		const sender = this.sourceMessage.member!;
		const voiceChannel = sender.voice.channel;

		if (!voiceChannel) {
			return this.failWithMissingVoiceChannel();
		}

		const matchingSounds = await db
			.select()
			.from(table.sound)
			.where(eq(table.sound.commandId, this.commandId))
			.leftJoin(table.asset, eq(table.asset.id, table.sound.assetId));

		const topSoundFilePath = server.assetManager.resolveAssetPath(matchingSounds[0].asset!.path, {
			accessibleByBackend: true
		});

		this.playSound(voiceChannel, topSoundFilePath);
	}

	private playSound(voiceChannel: VoiceBasedChannel, soundFilePath: string) {
		const guildId = voiceChannel.guildId;

		const permissions = voiceChannel.permissionsFor(this.guildState.member);
		if (!permissions.has('Connect') || !permissions.has('Speak')) {
			return this.failWithMissingPermissions();
		}

		const resource = createAudioResource(soundFilePath, {
			inlineVolume: true
		});
		resource.volume!.setVolume(0.15);

		const connection = joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: guildId,
			adapterCreator: voiceChannel.guild.voiceAdapterCreator,
			selfMute: false,
			selfDeaf: false
		});

		const player = createAudioPlayer();
		player
			.addListener('stateChange', (_oldState, newState) => {
				if (newState.status == AudioPlayerStatus.Idle) {
					connection.disconnect();
				}
			})
			.addListener('error', (err) => {
				connection.disconnect();
				console.error(err);
			});

		connection.subscribe(player);
		player.play(resource);
	}

	private async failWithMissingVoiceChannel() {
		const sourceTextChannel = this.sourceMessage.channel;
		await new Promise((res) => setTimeout(res, 500));

		this.sourceMessage.react('🖕');
		await new Promise((res) => setTimeout(res, 1000));

		await sourceTextChannel.sendTyping();
		await new Promise((res) => setTimeout(res, 2000));

		sourceTextChannel.send('Fuck you');
	}

	private async failWithMissingPermissions() {
		await this.sourceMessage.channel.send('need permission to join voice channels somehow.');
	}
}
