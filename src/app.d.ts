/* eslint-disable @typescript-eslint/consistent-type-imports */
declare global {
	namespace App {
		interface Locals {
			session: import('$lib/server/auth').Session | null;
		}
	}
}

export {};
