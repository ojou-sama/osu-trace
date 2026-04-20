import { env } from '$env/dynamic/private';
import { API, generateAuthorizationURL } from 'osu-api-v2-js';

export const OAUTH_STATE_COOKIE_NAME = 'osu_oauth_state';
export const OAUTH_NEXT_COOKIE_NAME = 'osu_oauth_next';

type OsuOAuthConfig = {
	clientId: number;
	clientSecret: string;
	redirectUri: string;
};

function getRequiredOAuthConfig(): OsuOAuthConfig {
	const clientIdRaw = env.OSU_CLIENT_ID;
	const clientSecret = env.OSU_CLIENT_SECRET;
	const redirectUri = env.OSU_OAUTH_REDIRECT_URI;

	if (!clientIdRaw) {
		throw new Error('OSU_CLIENT_ID is not set');
	}

	const clientId = Number(clientIdRaw);
	if (!Number.isInteger(clientId) || clientId <= 0) {
		throw new Error('OSU_CLIENT_ID must be a positive integer');
	}

	if (!clientSecret) {
		throw new Error('OSU_CLIENT_SECRET is not set');
	}

	if (!redirectUri) {
		throw new Error('OSU_OAUTH_REDIRECT_URI is not set');
	}

	return { clientId, clientSecret, redirectUri };
}

export function buildOsuLoginUrl(state: string): string {
	const { clientId, redirectUri } = getRequiredOAuthConfig();
	const url = new URL(generateAuthorizationURL(clientId, redirectUri, ['identify', 'public']));
	url.searchParams.set('state', state);
	return url.toString();
}

export async function getOsuUserFromCode(code: string): Promise<App.OsuAuthUser> {
	const { clientId, clientSecret, redirectUri } = getRequiredOAuthConfig();

	const api = await API.createAsync(clientId, clientSecret, { redirect_uri: redirectUri, code }, {
		set_token_on_expires: false,
		set_token_on_401: false,
		retry_maximum_amount: 1
	});

	const me = await api.getResourceOwner();
	return {
		id: me.id,
		username: me.username,
		avatarUrl: me.avatar_url || `https://a.ppy.sh/${me.id}`
	};
}
