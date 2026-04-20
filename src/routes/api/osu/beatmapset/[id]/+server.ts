import { json } from '@sveltejs/kit';
import { osuApiFetch } from '$lib/server/osu/api';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, fetch }) => {
	const beatmapsetId = Number(params.id);

	if (!Number.isInteger(beatmapsetId) || beatmapsetId <= 0) {
		return json({ error: 'Invalid beatmapset id' }, { status: 400 });
	}

	const beatmapset = await osuApiFetch(`/beatmapsets/${beatmapsetId}`, { fetch });
	return json(beatmapset);
};
