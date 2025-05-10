interface MimeTypeDescription {
	format: string;
	extension: string;
}

const MIME_TYPES = {
	'audio/mpeg': 'mp3',
	'audio/mp4': 'mp4',
	'audio/ogg': 'ogg',
	'audio/opus': 'opus',
	'audio/wav': 'wav',

	'video/mpeg': { extension: 'mpeg', format: 'mpegts' },
	'video/mp4': 'mp4',
	'video/ogg': 'ogg',
	'video/quicktime': 'mov',
	'video/webm': { extension: 'webm', format: 'dash' },
	'video/3gpp': '3gp'
} as Record<string, string | MimeTypeDescription>;

export function describeMimeType(type: string): MimeTypeDescription | undefined {
	if (type in MIME_TYPES) {
		const lookupValue = MIME_TYPES[type];

		if (typeof lookupValue === 'string') {
			return { extension: lookupValue, format: lookupValue };
		} else {
			return lookupValue;
		}
	} else {
		return undefined;
	}
}

export function findMimeTypeForExtension(fileExtension: string) {
	for (const [mimeType, description] of Object.entries(MIME_TYPES)) {
		if (typeof description === 'string') {
			if (description === fileExtension) {
				return mimeType;
			}
		} else {
			if (description.extension === fileExtension) {
				return mimeType;
			}
		}
	}

	return undefined;
}
