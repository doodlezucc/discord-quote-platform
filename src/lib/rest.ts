import type { GuildDataSoundPatch, GuildDataSoundSnippet } from './snippets';

type HttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';

type RestCallOptions = Omit<RequestInit, 'method'> & {
	queryParameters?: Record<string, unknown>;
};

class RestCaller {
	private async send(method: HttpMethod, path: string, options?: RestCallOptions) {
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

		return response;
	}

	private async request<T>(method: HttpMethod, path: string, options?: RestCallOptions) {
		const response = await this.send(method, path, options);

		if (!response.ok) {
			const responseText = response.text();
			throw new Error(`Error during REST call (${path}): ${responseText}`);
		}

		return (await response.json()) as T;
	}

	async guildSoundPost(guildId: string, file: File) {
		return await this.request<GuildDataSoundSnippet>('POST', `/v1/guilds/${guildId}/sounds`, {
			queryParameters: {
				name: file.name
			},
			body: file
		});
	}

	async guildSoundPatch(guildId: string, soundId: string, patch: GuildDataSoundPatch) {
		return await this.request<GuildDataSoundSnippet>(
			'PATCH',
			`/v1/guilds/${guildId}/sounds/${soundId}`,
			{ queryParameters: patch }
		);
	}
}

export const rest = new RestCaller();
