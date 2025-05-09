import { base } from '$app/paths';
import type {
	GuildDataCommandPatch,
	GuildDataCommandSnippet,
	GuildDataCommandSnippetPopulated,
	GuildDataSoundPatch,
	GuildDataSoundSnippet,
	UserGuildSnippet
} from './snippets';

type HttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';

type RestCallOptions = Omit<RequestInit, 'method'> & {
	queryParameters?: Record<string, unknown>;
};

class RestCaller {
	private async request(method: HttpMethod, path: string, options?: RestCallOptions) {
		let url = `${base}/api${path}`;

		if (options?.queryParameters) {
			const urlSearchParams = new URLSearchParams();

			for (const [key, value] of Object.entries(options.queryParameters)) {
				urlSearchParams.set(key, `${value}`);
			}

			if (urlSearchParams.size > 0) {
				url = `${url}?${urlSearchParams}`;
			}
		}

		const response = await fetch(url, {
			method: method,
			...options
		});

		if (!response.ok) {
			if (response.headers.get('Content-Type') === 'application/json') {
				const error = await response.json();

				if ('message' in error) {
					throw new Error(error.message);
				} else {
					throw new Error(error);
				}
			} else {
				const responseText = await response.text();
				throw new Error(responseText);
			}
		}

		return response;
	}

	private async requestObject<T>(method: HttpMethod, path: string, options?: RestCallOptions) {
		const response = await this.request(method, path, options);

		return (await response.json()) as T;
	}

	async guildsGet() {
		return await this.requestObject<UserGuildSnippet[]>('GET', `/v1/guilds`);
	}

	async guildCommandPost(guildId: string, name: string) {
		return await this.requestObject<GuildDataCommandSnippetPopulated>(
			'POST',
			`/v1/guilds/${guildId}/commands`,
			{ queryParameters: { name: name } }
		);
	}

	async guildCommandPatch(guildId: string, commandId: string, patch: GuildDataCommandPatch) {
		return await this.requestObject<GuildDataCommandSnippet>(
			'PATCH',
			`/v1/guilds/${guildId}/commands/${commandId}`,
			{ queryParameters: patch }
		);
	}

	async guildCommandDelete(guildId: string, commandId: string) {
		await this.request('DELETE', `/v1/guilds/${guildId}/commands/${commandId}`);
	}

	async guildCommandSoundPost(guildId: string, commandId: string, file: File) {
		let fileName = file.name;
		const fileNameExtensionIndex = fileName.lastIndexOf('.');

		if (fileNameExtensionIndex > 0) {
			fileName = fileName.slice(0, fileNameExtensionIndex);
		}

		return await this.requestObject<GuildDataSoundSnippet>(
			'POST',
			`/v1/guilds/${guildId}/commands/${commandId}/sounds`,
			{
				queryParameters: { name: fileName },
				body: file
			}
		);
	}

	async guildCommandSoundPatch(
		guildId: string,
		commandId: string,
		soundId: string,
		patch: GuildDataSoundPatch
	) {
		return await this.requestObject<GuildDataSoundSnippet>(
			'PATCH',
			`/v1/guilds/${guildId}/commands/${commandId}/sounds/${soundId}`,
			{ queryParameters: patch }
		);
	}

	async guildCommandSoundDelete(guildId: string, commandId: string, soundId: string) {
		await this.request('DELETE', `/v1/guilds/${guildId}/commands/${commandId}/sounds/${soundId}`);
	}
}

export const rest = new RestCaller();
