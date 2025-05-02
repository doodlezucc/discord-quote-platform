import type { RequestEvent } from '@sveltejs/kit';
import { expect, test } from 'vitest';
import { ZodError } from 'zod';
import { RestScope, zquery, type QueryZodSchema } from './rest';

test('Parse query parameters with Zod', () => {
	const schema = {
		name: zquery.string(),
		age: zquery.number().optional(),
		flag: zquery.boolean().optional()
	} satisfies QueryZodSchema;

	expect(() => restWithQuery('').parseQueryParameters(schema)).toThrow(ZodError);
	expect(() => restWithQuery('?age=22').parseQueryParameters(schema)).toThrow(ZodError);

	expect(restWithQuery('?name=who+or+what').parseQueryParameters(schema)).toStrictEqual({
		name: 'who or what'
	});

	expect(restWithQuery('?name=who+or+what&age=22').parseQueryParameters(schema)).toStrictEqual({
		name: 'who or what',
		age: 22
	});

	expect(
		restWithQuery('?name=who+or+what&flag=false&age=22').parseQueryParameters(schema)
	).toStrictEqual({
		name: 'who or what',
		age: 22,
		flag: false
	});

	expect(
		restWithQuery('?flag=false&name=who+or+what&age=22').parseQueryParameters(schema)
	).toStrictEqual({
		name: 'who or what',
		age: 22,
		flag: false
	});
});

test('Parse boolean query parameters with Zod', () => {
	const schema = {
		flag: zquery.boolean(),
		flagOptional: zquery.boolean().optional(),
		flagDefTrue: zquery.boolean({ default: true }),
		flagDefFalse: zquery.boolean({ default: false })
	} satisfies QueryZodSchema;

	expect(() => restWithQuery('').parseQueryParameters(schema)).toThrow(ZodError);

	expect(restWithQuery('?flag').parseQueryParameters(schema)).toStrictEqual({
		flag: true,
		flagDefTrue: true,
		flagDefFalse: false
	});
	expect(restWithQuery('?flag=false').parseQueryParameters(schema)).toStrictEqual({
		flag: false,
		flagDefTrue: true,
		flagDefFalse: false
	});
	expect(
		restWithQuery(
			'?flag&flagOptional=true&flagDefTrue=false&flagDefFalse=false'
		).parseQueryParameters(schema)
	).toStrictEqual({
		flag: true,
		flagOptional: true,
		flagDefTrue: false,
		flagDefFalse: false
	});
});

function restWithQuery(queryString: string) {
	return new RestScope({
		url: URL.parse(`http://localhost/test${queryString}`)
	} as RequestEvent);
}
