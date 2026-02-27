import { error, json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProjectBySlug, getRepoInProject } from '$lib/server/config';
import { getTree } from '$lib/server/repo-store';

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.session) throw redirect(303, '/');

	const project = await getProjectBySlug(params.slug);
	if (!project.users.includes((locals.user?.email ?? '').toLowerCase())) {
		throw error(403, 'You do not have access to this project');
	}

	const repo = getRepoInProject(project, params.repo);
	const tree = await getTree(project.slug, repo);

	return json({ tree });
};
