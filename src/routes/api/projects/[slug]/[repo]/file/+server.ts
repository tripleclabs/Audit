import { error, json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as Sentry from '@sentry/sveltekit';
import { getProjectBySlug, getRepoInProject, repoKey } from '$lib/server/config';
import { getFileContent, getTree } from '$lib/server/repo-store';
import { db } from '$lib/server/db';
import { audit } from '$lib/server/db/schema';

const accessLog = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const THRESHOLD = 20;

function checkAccessRate(userId: string): void {
	const now = Date.now();
	const timestamps = accessLog.get(userId) ?? [];
	const recent = timestamps.filter((t) => now - t < WINDOW_MS);
	recent.push(now);
	accessLog.set(userId, recent);

	if (recent.length === THRESHOLD + 1) {
		Sentry.captureMessage(`High file access rate: ${userId} accessed ${recent.length} files in 1 minute`, {
			level: 'warning',
			tags: { type: 'bulk_access' },
			extra: { userId, count: recent.length }
		});
	}
}

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

	checkAccessRate(userIdentifier);

	return json({ path, content });
};
