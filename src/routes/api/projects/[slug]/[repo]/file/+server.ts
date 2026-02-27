import { error, json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProjectBySlug, getRepoInProject, repoKey } from '$lib/server/config';
import { getFileContent } from '$lib/server/repo-store';
import { db } from '$lib/server/db';
import { audit } from '$lib/server/db/schema';

export const GET: RequestHandler = async ({ locals, params, url, request }) => {
	if (!locals.session) throw redirect(303, '/');
	const user = locals.user ?? null;

	const project = await getProjectBySlug(params.slug);
	if (!user?.email || !project.users.includes(user.email.toLowerCase())) {
		throw error(403, 'You do not have access to this project');
	}

	const path = url.searchParams.get('path');
	if (!path) throw error(400, 'Missing required query param: path');

	const repo = getRepoInProject(project, params.repo);
	const content = await getFileContent(project.slug, repo, path);

	const rawIp =
		request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
	const ip = rawIp.split(',')[0].trim() || 'unknown';
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
