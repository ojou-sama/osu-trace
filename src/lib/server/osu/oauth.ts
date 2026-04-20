import { env } from '$env/dynamic/private';

type CachedToken = {
	accessToken: string;
	expiresAtMs: number;
};

type OsuTokenResponse = {
	access_token: string;
	expires_in: number;
	token_type: string;
};

const DEFAULT_TOKEN_URL = 'https://osu.ppy.sh/oauth/token';
const TOKEN_REFRESH_BUFFER_MS = 60_000;

let cachedToken: CachedToken | null = null;
let inFlightTokenRequest: Promise<CachedToken> | null = null;

function isTokenUsable(token: CachedToken | null): token is CachedToken {
	if (!token) return false;
	return token.expiresAtMs - TOKEN_REFRESH_BUFFER_MS > Date.now();
}

function getRequiredOsuCredentials() {
	const clientId = env.OSU_CLIENT_ID;
	const clientSecret = env.OSU_CLIENT_SECRET;

	if (!clientId) {
		throw new Error('OSU_CLIENT_ID is not set');
	}

	if (!clientSecret) {
		throw new Error('OSU_CLIENT_SECRET is not set');
	}

	return { clientId, clientSecret };
}

async function requestAccessToken(fetchImpl: typeof fetch): Promise<CachedToken> {
	const { clientId, clientSecret } = getRequiredOsuCredentials();
	const tokenUrl = env.OSU_OAUTH_TOKEN_URL || DEFAULT_TOKEN_URL;

	const body = new URLSearchParams({
		client_id: clientId,
		client_secret: clientSecret,
		grant_type: 'client_credentials',
		scope: 'public'
	});

	const response = await fetchImpl(tokenUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json'
		},
		body
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to fetch osu access token (${response.status}): ${errorText}`);
	}

	const payload = (await response.json()) as OsuTokenResponse;

	if (!payload.access_token || !payload.expires_in) {
		throw new Error('osu token response is missing access_token or expires_in');
	}

	return {
		accessToken: payload.access_token,
		expiresAtMs: Date.now() + payload.expires_in * 1000
	};
}

export async function getOsuAccessToken(options?: {
	fetch?: typeof fetch;
	forceRefresh?: boolean;
}): Promise<string> {
	const fetchImpl = options?.fetch ?? fetch;
	const forceRefresh = options?.forceRefresh ?? false;

	if (!forceRefresh && isTokenUsable(cachedToken)) {
		return cachedToken.accessToken;
	}

	if (!forceRefresh && inFlightTokenRequest) {
		return (await inFlightTokenRequest).accessToken;
	}

	inFlightTokenRequest = requestAccessToken(fetchImpl)
		.then((token) => {
			cachedToken = token;
			return token;
		})
		.finally(() => {
			inFlightTokenRequest = null;
		});

	return (await inFlightTokenRequest).accessToken;
}