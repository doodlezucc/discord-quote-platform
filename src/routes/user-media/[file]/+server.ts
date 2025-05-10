import { server } from '$lib/server';
import { findMimeTypeForExtension } from '$lib/server/util/mime-types';
import { createReadableStream } from '@sveltejs/kit/node';
import * as fs from 'fs/promises';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const userMediaPath = server.assetManager.resolveAssetPath(params.file, {
		accessibleByBackend: true
	});

	const fileExtension = userMediaPath.substring(userMediaPath.lastIndexOf('.') + 1);
	const mimeType = findMimeTypeForExtension(fileExtension);

	const contentLength = (await fs.stat(userMediaPath)).size;

	return new Response(createReadableStream(userMediaPath), {
		headers: {
			'Content-Length': `${contentLength}`,
			...(mimeType ? { 'Content-Type': mimeType } : {})
		}
	});
};
