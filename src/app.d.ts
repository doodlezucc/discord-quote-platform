// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			session: import('$lib/server/auth').Session | null;
		}
	}
}

export {};
