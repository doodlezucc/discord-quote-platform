import { error, type RequestEvent, type RequestHandler } from '@sveltejs/kit';
import { REST, Routes, type RESTGetAPICurrentUserGuildsResult } from 'discord.js';
import type { Session } from '../auth';
import { bot } from '../bot';

class AuthScope {
	private session?: Session;

	constructor(private readonly event: RequestEvent) {}

	requireSession(): Session {
		if (this.session) return this.session;

		if (!this.event.locals.session) {
			throw error(401, { message: 'Unable to infer Discord user access' });
		}

		return (this.session = this.event.locals.session);
	}

	async requireMemberOfGuild(guildId: string) {
		const { accessToken } = this.requireSession();

		const rest = new REST({ authPrefix: 'Bearer' }).setToken(accessToken);
		const userGuilds = (await rest.get(Routes.userGuilds())) as RESTGetAPICurrentUserGuildsResult;

		const guildUser = userGuilds.find((guild) => guild.id === guildId);

		if (!guildUser) {
			throw error(401, { message: 'Missing permissions in guild' });
		}

		return guildUser;
	}

	async requireGuildState(guildId: string) {
		const guildState = (await bot).guildStates.get(guildId);

		if (!guildState) {
			throw error(401, { message: 'Guild is not registered with a bot state' });
		}

		return guildState;
	}
}

interface ExtendedRequestEvent<
	Params extends Record<string, string>,
	RouteId extends string | null = string | null
> extends RequestEvent<Params, RouteId> {
	auth: AuthScope;
}

type ExtendedRequestHandler<
	Params extends Record<string, string>,
	RouteId extends string | null = string | null
> = (event: ExtendedRequestEvent<Params, RouteId>) => Promise<Response>;

export function authorized<
	Params extends Record<string, string>,
	RouteId extends string | null = string | null
>(handle: ExtendedRequestHandler<Params, RouteId>): RequestHandler<Params, RouteId> {
	return async (event) => {
		let authScope: AuthScope | undefined = undefined;

		return await handle({
			...event,
			get auth() {
				return (authScope ??= new AuthScope(event));
			}
		});
	};
}
