import { error, json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProjectBySlug } from '$lib/server/config';
import { searchProject } from '$lib/server/repo-store';

export const GET: RequestHandler = async ({ locals, params, url }) => {
	if (!locals.session) throw redirect(303, '/');

	const project = await getProjectBySlug(params.slug);
	if (!project.users.includes((locals.user?.email ?? '').toLowerCase())) {
		throw error(403, 'You do not have access to this project');
	}

	const q = url.searchParams.get('q')?.trim() ?? '';
	if (q.length < 2) {
		throw error(400, 'Search query must be at least 2 characters');
	}
	if (q.length > 200) {
		throw error(400, 'Search query too long');
	}
	if (q.startsWith('-')) {
		throw error(400, 'Invalid search query');
	}

	const results = await searchProject(project.slug, project.repos, q);

	return json({ results });
};
