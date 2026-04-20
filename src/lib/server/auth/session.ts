import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import type { Cookies } from '@sveltejs/kit';
import { createHmac, timingSafeEqual } from 'node:crypto';

const AUTH_COOKIE_NAME = 'osu_session';
const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;

export type AuthUserSession = App.OsuAuthUser;

function getSessionSecret() {
	const secret = env.OSU_SESSION_SECRET;

	if (!secret) {
		throw new Error('OSU_SESSION_SECRET is not set');
	}

	return secret;
}

function signPayload(payload: string): string {
	return createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
}

function makeCookieValue(session: AuthUserSession): string {
	const payload = Buffer.from(JSON.stringify(session), 'utf-8').toString('base64url');
	const signature = signPayload(payload);
	return `${payload}.${signature}`;
}

function parseCookieValue(cookieValue: string): AuthUserSession | null {
	const [payload, signature] = cookieValue.split('.');
	if (!payload || !signature) return null;

	const expectedSignature = signPayload(payload);
	if (signature.length !== expectedSignature.length) return null;

	const isSignatureValid = timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
	if (!isSignatureValid) return null;

	try {
		const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as AuthUserSession;
		if (
			typeof decoded.id !== 'number' ||
			typeof decoded.username !== 'string' ||
			typeof decoded.avatarUrl !== 'string'
		) {
			return null;
		}

		return decoded;
	} catch {
		return null;
	}
}

export function readAuthSessionCookie(cookies: Cookies): AuthUserSession | null {
	const raw = cookies.get(AUTH_COOKIE_NAME);
	if (!raw) return null;

	return parseCookieValue(raw);
}

export function setAuthSessionCookie(cookies: Cookies, session: AuthUserSession): void {
	cookies.set(AUTH_COOKIE_NAME, makeCookieValue(session), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: THIRTY_DAYS_IN_SECONDS
	});
}

export function clearAuthSessionCookie(cookies: Cookies): void {
	cookies.delete(AUTH_COOKIE_NAME, { path: '/' });
}
