import {
	AudioPlayerStatus,
	createAudioPlayer,
	createAudioResource,
	joinVoiceChannel,
	StreamType
} from '@discordjs/voice';
import type { Message, VoiceBasedChannel } from 'discord.js';
import { createReadStream } from 'node:fs';
import { server } from '..';
import { pipeToEffectProcessed } from '../processing';
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

		const sound = await this.guildState.queryProcessor.searchForSound(this.commandId, this.query);

		if (!sound) {
			return this.failWithNoMatchingSounds();
		}

		const topSoundFilePath = server.assetManager.resolveAssetPath(sound.assetPath, {
			accessibleByBackend: true
		});

		await this.playSound(voiceChannel, topSoundFilePath);
	}

	private async playSound(voiceChannel: VoiceBasedChannel, soundFilePath: string) {
		const guildId = voiceChannel.guildId;

		const permissions = voiceChannel.permissionsFor(this.guildState.member);
		if (!permissions.has('Connect') || !permissions.has('Speak')) {
			return await this.failWithMissingPermissions();
		}

		const rawAudioStream = createReadStream(soundFilePath);
		const inputStream = pipeToEffectProcessed(rawAudioStream, 'ogg', 'ogg', {
			clippingThreshold: 0.3,
			volume: 0.5
		});

		const resource = createAudioResource(inputStream, {
			// For some reason, "inlineVolume" is needed when passing an input stream
			inlineVolume: true,
			inputType: StreamType.OggOpus
		});

		const connection = joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: guildId,
			adapterCreator: voiceChannel.guild.voiceAdapterCreator,
			selfMute: false,
			selfDeaf: false
		});

		const player = createAudioPlayer();
		player
			.on('stateChange', (_oldState, newState) => {
				if (newState.status == AudioPlayerStatus.Idle) {
					player.stop(true);
					connection.disconnect();
				}
			})
			.on('error', (err) => {
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

	private async failWithNoMatchingSounds() {
		await this.sourceMessage.channel.send('No matching sounds!');
	}
}
