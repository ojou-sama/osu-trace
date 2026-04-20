import { clearAuthSessionCookie } from '$lib/server/auth/session';
import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';

export const POST: RequestHandler = ({ cookies, request }) => {
	clearAuthSessionCookie(cookies);

	const referer = request.headers.get('referer');
	if (referer) {
		const refererUrl = new URL(referer);
		if (refererUrl.pathname.startsWith('/')) {
			throw redirect(302, `${refererUrl.pathname}${refererUrl.search}`);
		}
	}

	throw redirect(302, '/');
};
