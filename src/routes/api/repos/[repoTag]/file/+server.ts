import { error, json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRepoByTag } from '$lib/server/config';
import { getFileFromRepo } from '$lib/server/github';

export const GET: RequestHandler = async ({ locals, params, url }) => {
	const session = locals.session ?? null;
	if (!session) {
		throw redirect(303, '/');
	}

	const path = url.searchParams.get('path');
	if (!path) {
		throw error(400, 'Missing required query param: path');
	}

	const repo = await getRepoByTag(params.repoTag);
	const content = await getFileFromRepo(repo, path);

	return json({ path, content });
};
