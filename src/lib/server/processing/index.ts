import ffmpeg from 'fluent-ffmpeg';
import { PassThrough, Readable } from 'node:stream';
import type { ReadableStream } from 'node:stream/web';
import { describeMimeType } from '../util/mime-types';

export function pipeRequestBodyToNormalizedAudio(request: Request, outputFormat: string): Readable {
	const outputStream = new PassThrough();

	function onError(error: Error, stdout: string | null, stderr: string | null) {
		console.error(error.message + `\nSTDOUT:\n${stdout}` + `\nSTDERR:\n${stderr}`);
		outputStream.destroy(error);
	}

	const command = createFFmpegInputFromRequest(request)
		// Only select the first audio stream from the input
		.outputOption('-map 0:a:0')
		.audioFilter([
			{
				filter: 'speechnorm',
				options: {
					expansion: 40,
					compression: 40,
					threshold: 1,
					invert: 1,
					link: 1,
					raise: 0.0003,
					fall: 0.0003
				}
			}
		])
		.outputFormat(outputFormat)
		.output(outputStream, { end: false })
		.on('error', onError)
		.on('end', (stdout, stderr) => {
			if (stderr && stderr.includes('Error')) {
				return onError(new Error('Failed to normalize audio stream'), stdout, stderr);
			}

			outputStream.end();
		});

	command.run();

	return outputStream;
}

function createFFmpegInputFromRequest(request: Request) {
	const contentType = request.headers.get('Content-Type');
	if (!contentType) {
		throw new Error('Audio processing failed because request Content-Type header is not set');
	}

	const mimeType = describeMimeType(contentType);
	if (!mimeType) {
		throw new Error('Audio processing failed because MIME type could not be recognized');
	}

	const inputStream = Readable.fromWeb(request.body! as ReadableStream);

	return ffmpeg().input(inputStream).inputFormat(mimeType.format);
}

export interface AudioEffectOptions {
	clippingThreshold: number;
	volume: number;
}

export function pipeToEffectProcessed(
	inputStream: Readable,
	inputFormat: string,
	outputFormat: string,
	effects: AudioEffectOptions
): Readable {
	const outputStream = new PassThrough();

	function onError(error: Error, stdout: string | null, stderr: string | null) {
		console.error(error.message + `\nSTDOUT:\n${stdout}` + `\nSTDERR:\n${stderr}`);
		outputStream.destroy(error);
	}

	const command = ffmpeg()
		.input(inputStream)
		.inputFormat(inputFormat)
		.audioFilter([
			{
				filter: 'asoftclip',
				options: {
					type: 'hard',
					threshold: effects.clippingThreshold
				}
			},
			{
				filter: 'volume',
				options: effects.volume
			}
		])
		.outputFormat(outputFormat)
		.output(outputStream, { end: false })
		.on('error', onError);

	command.run();

	return outputStream;
}
