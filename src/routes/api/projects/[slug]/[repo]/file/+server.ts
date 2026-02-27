import { error, json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProjectBySlug, getRepoInProject, repoKey } from '$lib/server/config';
import { getFileContent, getTree } from '$lib/server/repo-store';
import { db } from '$lib/server/db';
import { audit } from '$lib/server/db/schema';

export const GET: RequestHandler = async (event) => {
	const { locals, params, url } = event;
	if (!locals.session) throw redirect(303, '/');
	const user = locals.user ?? null;

	const project = await getProjectBySlug(params.slug);
	if (!user?.email || !project.users.includes(user.email.toLowerCase())) {
		throw error(403, 'You do not have access to this project');
	}

	const path = url.searchParams.get('path');
	if (!path) throw error(400, 'Missing required query param: path');

	const repo = getRepoInProject(project, params.repo);

	const tree = await getTree(project.slug, repo);
	if (!tree.some((node) => node.type === 'blob' && node.path === path)) {
		throw error(404, 'File not found');
	}

	const content = await getFileContent(project.slug, repo, path);

	const ip = event.getClientAddress();
	const userIdentifier = user?.email || user?.name || user?.id || 'unknown';

	db.insert(audit)
		.values({
			user: userIdentifier,
			ip,
			repo: repoKey(project.slug, repo),
			file_path: path
		})
		.catch((e) => {
			console.error('failed to log audit entry', e);
		});

	return json({ path, content });
};
