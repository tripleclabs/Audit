import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getRepoByTag } from '$lib/server/config';
import { getFileFromRepo, getTreeForRepo } from '$lib/server/github';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const session = await locals.auth();
	if (!session) {
		throw redirect(303, '/');
	}

	const repo = await getRepoByTag(params.repoTag);
	const tree = await getTreeForRepo(repo);
	const selectedPath = url.searchParams.get('path') ?? '';

	if (selectedPath && !tree.some((node) => node.type === 'blob' && node.path === selectedPath)) {
		throw error(404, 'File path not found');
	}

	const selectedContent = selectedPath ? await getFileFromRepo(repo, selectedPath) : '';

	return {
		repo,
		tree,
		selectedPath,
		selectedContent
	};
};
