import {
	getOsuUserFromCode,
	OAUTH_NEXT_COOKIE_NAME,
	OAUTH_STATE_COOKIE_NAME
} from '$lib/server/osu/user-oauth';
import {
	clearAuthSessionCookie,
	setAuthSessionCookie
} from '$lib/server/auth/session';
import type { RequestHandler } from './$types';
import { error, redirect } from '@sveltejs/kit';

function isSafeRelativePath(pathname: string): boolean {
	return pathname.startsWith('/') && !pathname.startsWith('//');
}

export const GET: RequestHandler = async ({ cookies, url }) => {
	const oauthError = url.searchParams.get('error');
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');

	if (oauthError) {
		clearAuthSessionCookie(cookies);
		throw redirect(302, '/?auth=denied');
	}

	if (!code || !state) {
		throw error(400, 'Missing OAuth callback parameters');
	}

	const expectedState = cookies.get(OAUTH_STATE_COOKIE_NAME);
	cookies.delete(OAUTH_STATE_COOKIE_NAME, { path: '/' });

	if (!expectedState || expectedState !== state) {
		throw error(400, 'Invalid OAuth state');
	}

	const nextPath = cookies.get(OAUTH_NEXT_COOKIE_NAME);
	cookies.delete(OAUTH_NEXT_COOKIE_NAME, { path: '/' });

	let user: App.OsuAuthUser;

	try {
		user = await getOsuUserFromCode(code);
	} catch {
		clearAuthSessionCookie(cookies);
		throw redirect(302, '/?auth=failed');
	}

	setAuthSessionCookie(cookies, user);

	if (nextPath && isSafeRelativePath(nextPath)) {
		throw redirect(302, nextPath);
	}

	throw redirect(302, `/profile/${user.id}`);
};
