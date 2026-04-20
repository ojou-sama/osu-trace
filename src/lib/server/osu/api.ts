import { env } from '$env/dynamic/private';
import { getOsuAccessToken } from './oauth';

type QueryValue = string | number | boolean | null | undefined;

export type OsuApiFetchOptions = Omit<RequestInit, 'headers'> & {
	headers?: HeadersInit;
	query?: Record<string, QueryValue>;
	fetch?: typeof fetch;
};

const DEFAULT_API_BASE_URL = 'https://osu.ppy.sh/api/v2';

function buildApiUrl(path: string, query?: Record<string, QueryValue>): URL {
	const baseUrl = env.OSU_API_BASE_URL || DEFAULT_API_BASE_URL;
	const cleanedPath = path.startsWith('/') ? path.slice(1) : path;
	const url = new URL(cleanedPath, `${baseUrl}/`);

	if (query) {
		for (const [key, value] of Object.entries(query)) {
			if (value === undefined || value === null) continue;
			url.searchParams.set(key, String(value));
		}
	}

	return url;
}

async function executeRequest<T>(
	url: URL,
	token: string,
	options: OsuApiFetchOptions,
	fetchImpl: typeof fetch
): Promise<Response> {
	const headers = new Headers(options.headers);
	headers.set('Authorization', `Bearer ${token}`);
	headers.set('Accept', 'application/json');

	return fetchImpl(url, {
		...options,
		headers
	});
}

export async function osuApiFetch<T>(path: string, options: OsuApiFetchOptions = {}): Promise<T> {
	const fetchImpl = options.fetch ?? fetch;
	const url = buildApiUrl(path, options.query);

	const initialToken = await getOsuAccessToken({ fetch: fetchImpl });
	let response = await executeRequest<T>(url, initialToken, options, fetchImpl);

	if (response.status === 401) {
		const refreshedToken = await getOsuAccessToken({ fetch: fetchImpl, forceRefresh: true });
		response = await executeRequest<T>(url, refreshedToken, options, fetchImpl);
	}

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`osu api request failed (${response.status}) ${url.pathname}: ${errorText}`);
	}

	return (await response.json()) as T;
}