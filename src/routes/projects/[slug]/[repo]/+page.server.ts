import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getProjectBySlug, getRepoInProject, repoKey } from '$lib/server/config';
import { getTree, getFileContent } from '$lib/server/repo-store';
import { db } from '$lib/server/db';
import { audit, note } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals, url, request }) => {
	if (!locals.session) throw redirect(303, '/');
	const user = locals.user ?? null;

	const project = await getProjectBySlug(params.slug);
	if (!user?.email || !project.users.includes(user.email.toLowerCase())) {
		throw error(403, 'You do not have access to this project');
	}

	const repo = getRepoInProject(project, params.repo);
	const tree = await getTree(project.slug, repo);
	const selectedPath = url.searchParams.get('path') ?? '';
	const selectedLine = parseInt(url.searchParams.get('line') ?? '0', 10) || 0;

	if (selectedPath && !tree.some((node) => node.type === 'blob' && node.path === selectedPath)) {
		throw error(404, 'File path not found');
	}

	let selectedContent = '';
	if (selectedPath) {
		selectedContent = await getFileContent(project.slug, repo, selectedPath);

		const rawIp =
			request.headers.get('x-forwarded-for') ||
			request.headers.get('x-real-ip') ||
			'unknown';
		const ip = rawIp.split(',')[0].trim() || 'unknown';
		const userIdentifier = user?.email || user?.name || user?.id || 'unknown';

		db.insert(audit)
			.values({
				user: userIdentifier,
				ip,
				repo: repoKey(project.slug, repo),
				file_path: selectedPath
			})
			.catch((e) => {
				console.error('failed to log audit entry', e);
			});
	}

	const rk = repoKey(project.slug, repo);
	let noteContent = '';
	if (selectedPath && user) {
		const existing = await db
			.select()
			.from(note)
			.where(and(eq(note.userId, user.id), eq(note.repoTag, rk), eq(note.filePath, selectedPath)))
			.limit(1);
		if (existing.length > 0) {
			noteContent = existing[0].content;
		}
	}

	return {
		project,
		repo,
		tree,
		selectedPath,
		selectedLine,
		selectedContent,
		noteContent
	};
};

export const actions: Actions = {
	saveNote: async ({ request, locals, params }) => {
		if (!locals.user) throw redirect(303, '/');

		const formData = await request.formData();
		const filePath = formData.get('filePath')?.toString();
		const content = formData.get('content')?.toString() ?? '';

		if (!filePath) return fail(400, { message: 'Missing file path' });

		const project = await getProjectBySlug(params.slug);
		const repo = getRepoInProject(project, params.repo);
		const rk = repoKey(project.slug, repo);

		await db
			.insert(note)
			.values({
				userId: locals.user.id,
				repoTag: rk,
				filePath,
				content,
				updatedAt: new Date()
			})
			.onConflictDoUpdate({
				target: [note.userId, note.repoTag, note.filePath],
				set: { content, updatedAt: new Date() }
			});

		return { success: true };
	}
};
