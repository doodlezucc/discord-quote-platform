import type { GuildDataSoundPatch, GuildDataSoundSnippet, UserGuildSnippet } from './snippets';

type HttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';

type RestCallOptions = Omit<RequestInit, 'method'> & {
	queryParameters?: Record<string, unknown>;
};

class RestCaller {
	private async request(method: HttpMethod, path: string, options?: RestCallOptions) {
		let url = `/api${path}`;

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
			const responseText = response.text();
			throw new Error(`Error during REST call (${path}): ${responseText}`);
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

	async guildSoundPost(guildId: string, file: File) {
		return await this.requestObject<GuildDataSoundSnippet>('POST', `/v1/guilds/${guildId}/sounds`, {
			queryParameters: {
				name: file.name
			},
			body: file
		});
	}

	async guildSoundPatch(guildId: string, soundId: string, patch: GuildDataSoundPatch) {
		return await this.requestObject<GuildDataSoundSnippet>(
			'PATCH',
			`/v1/guilds/${guildId}/sounds/${soundId}`,
			{ queryParameters: patch }
		);
	}

	async guildSoundDelete(guildId: string, soundId: string) {
		await this.request('DELETE', `/v1/guilds/${guildId}/sounds/${soundId}`);
	}
}

export const rest = new RestCaller();
