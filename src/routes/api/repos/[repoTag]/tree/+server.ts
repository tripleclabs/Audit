import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRepoByTag } from '$lib/server/config';
import { getTreeForRepo } from '$lib/server/github';

export const GET: RequestHandler = async ({ locals, params }) => {
	const session = locals.session ?? null;
	if (!session) {
		throw redirect(303, '/');
	}

	const repo = await getRepoByTag(params.repoTag);
	const tree = await getTreeForRepo(repo);

	return json({ tree });
};
