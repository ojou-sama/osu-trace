import { readAuthSessionCookie } from '$lib/server/auth/session';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.authUser = readAuthSessionCookie(event.cookies);
	return resolve(event);
};
