import ffmpeg from 'fluent-ffmpeg';
import * as mime from 'mime-types';
import { PassThrough, Readable } from 'node:stream';
import type { ReadableStream } from 'node:stream/web';

export function streamRequestBodyToNormalizedOpus(request: Request): Readable {
	const contentType = request.headers.get('Content-Type');
	if (!contentType) {
		throw new Error('Audio processing failed because request Content-Type header is not set');
	}

	const fileExtension = mime.extension(contentType);
	if (!fileExtension) {
		throw new Error('Audio processing failed because MIME type could not be recognized');
	}

	const inputStream = Readable.fromWeb(request.body! as ReadableStream);
	const outputStream = new PassThrough({});

	function onError(error: Error, stdout: string | null, stderr: string | null) {
		console.error(error.message + `\nSTDOUT:\n${stdout}` + `\nSTDERR:\n${stderr}`);
		outputStream.destroy(error);
	}

	const command = ffmpeg()
		.input(inputStream)
		.inputFormat(fileExtension)
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
		.outputFormat('ogg')
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
