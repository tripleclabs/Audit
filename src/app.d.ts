import type { User, Session } from 'better-auth/minimal';

declare global {
	namespace App {
		interface Locals {
			user?: User | null;
			session?: Session | null;
		}

		interface PageData { session: Session | null }
	}
}

export {};
