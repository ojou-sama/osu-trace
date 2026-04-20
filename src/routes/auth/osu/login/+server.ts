import { dev } from '$app/environment';
import { buildOsuLoginUrl, OAUTH_NEXT_COOKIE_NAME, OAUTH_STATE_COOKIE_NAME } from '$lib/server/osu/user-oauth';
import type { RequestHandler } from './$types';
import { randomBytes } from 'node:crypto';
import { redirect } from '@sveltejs/kit';

const TEN_MINUTES_IN_SECONDS = 60 * 10;

function isSafeRelativePath(pathname: string): boolean {
	return pathname.startsWith('/') && !pathname.startsWith('//');
}

export const GET: RequestHandler = ({ cookies, url }) => {
	const state = randomBytes(18).toString('base64url');
	const next = url.searchParams.get('next');

	cookies.set(OAUTH_STATE_COOKIE_NAME, state, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: TEN_MINUTES_IN_SECONDS
	});

	if (next && isSafeRelativePath(next)) {
		cookies.set(OAUTH_NEXT_COOKIE_NAME, next, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: !dev,
			maxAge: TEN_MINUTES_IN_SECONDS
		});
	} else {
		cookies.delete(OAUTH_NEXT_COOKIE_NAME, { path: '/' });
	}

	throw redirect(302, buildOsuLoginUrl(state));
};
