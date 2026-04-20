// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface OsuAuthUser {
			id: number;
			username: string;
			avatarUrl: string;
		}

		interface Locals {
			authUser: OsuAuthUser | null;
		}

		interface PageData {
			currentUser: OsuAuthUser | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
