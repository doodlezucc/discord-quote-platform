import { error, type RequestEvent, type RequestHandler } from '@sveltejs/kit';
import { REST as DiscordRest, Routes, type RESTGetAPICurrentUserGuildsResult } from 'discord.js';
import { z, ZodObject } from 'zod';
import type { Session } from './auth';
import { bot } from './bot';

export const zquery = {
	string() {
		return z.string();
	},

	number() {
		return z.coerce.number();
	},

	boolean(options?: { default: boolean }) {
		const requiredType = z.string().transform((value) => ['', '1', 'True', 'true'].includes(value));

		if (options !== undefined) {
			return requiredType.default(options.default ? 'true' : 'false');
		}

		return requiredType;
	}
};

type ValidQueryZodType = ReturnType<(typeof zquery)[keyof typeof zquery]>;

export interface QueryZodSchema {
	[parameter: string]:
		| ValidQueryZodType
		| z.ZodOptional<ValidQueryZodType>
		| z.ZodDefault<ValidQueryZodType>;
}

export class RestScope {
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

		const rest = new DiscordRest({ authPrefix: 'Bearer' }).setToken(accessToken);
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

	parseQueryParameters<T extends QueryZodSchema>(shape: T): z.infer<ZodObject<T>> {
		const schema = z.strictObject(shape);

		const queryParameters = Object.fromEntries(this.event.url.searchParams.entries());

		return schema.parse(queryParameters);
	}
}

interface ExtendedRequestEvent<
	Params extends Record<string, string>,
	RouteId extends string | null = string | null
> extends RequestEvent<Params, RouteId> {
	rest: RestScope;
}

type ExtendedRequestHandler<
	Params extends Record<string, string>,
	RouteId extends string | null = string | null
> = (event: ExtendedRequestEvent<Params, RouteId>) => Promise<Response>;

export function REST<
	Params extends Record<string, string>,
	RouteId extends string | null = string | null
>(handle: ExtendedRequestHandler<Params, RouteId>): RequestHandler<Params, RouteId> {
	return async (event) => {
		let restScope: RestScope | undefined = undefined;

		return await handle({
			...event,
			get rest() {
				return (restScope ??= new RestScope(event));
			}
		});
	};
}
