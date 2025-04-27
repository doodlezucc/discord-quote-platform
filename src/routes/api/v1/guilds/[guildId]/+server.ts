import { json } from '@sveltejs/kit';
import type { RequestHandler } from '../$types';

export const GET: RequestHandler = async ({ locals }) => {
	console.log(locals.session?.id);

	return json({});
};
