import { server } from '$lib/server';
import { findMimeTypeForExtension } from '$lib/server/util/mime-types';
import { createReadableStream } from '@sveltejs/kit/node';
import * as fs from 'fs/promises';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, request }) => {
	const userMediaPath = server.assetManager.resolveAssetPath(params.file, {
		accessibleByBackend: true
	});

	const fileStats = await fs.stat(userMediaPath);
	const contentLength = fileStats.size;
	const lastModified = fileStats.ctime;
	lastModified.setMilliseconds(0);

	const ifModifiedSinceHeader = request.headers.get('If-Modified-Since');
	if (ifModifiedSinceHeader) {
		if (lastModified.getTime() <= Date.parse(ifModifiedSinceHeader)) {
			return new Response(null, { status: 304 });
		}
	}

	const fileExtension = userMediaPath.substring(userMediaPath.lastIndexOf('.') + 1);
	const mimeType = findMimeTypeForExtension(fileExtension);

	return new Response(createReadableStream(userMediaPath), {
		headers: {
			'Last-Modified': lastModified.toUTCString(),
			'Content-Length': `${contentLength}`,
			...(mimeType ? { 'Content-Type': mimeType } : {})
		}
	});
};
