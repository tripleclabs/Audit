import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getRepoByTag } from '$lib/server/config';
import { getFileFromRepo, getTreeForRepo } from '$lib/server/github';
import { db } from '$lib/server/db';
import { audit, note } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals, url, request }) => {
	const session = locals.session ?? null;
	if (!session) {
		throw redirect(303, '/');
	}
	const user = locals.user ?? null;

	const repo = await getRepoByTag(params.repoTag);
	const tree = await getTreeForRepo(repo);
	const selectedPath = url.searchParams.get('path') ?? '';

	if (selectedPath && !tree.some((node) => node.type === 'blob' && node.path === selectedPath)) {
		throw error(404, 'File path not found');
	}

	let selectedContent = '';
	if (selectedPath) {
		selectedContent = await getFileFromRepo(repo, selectedPath);

		// audit log for the SSR load path as well
		const rawIp =
			request.headers.get('x-forwarded-for') ||
			request.headers.get('x-real-ip') ||
			'unknown';
		const ip = rawIp.split(',')[0].trim() || 'unknown';
		const userIdentifier =
			user?.email || user?.name || user?.id || 'unknown';

		db.insert(audit).values({
			user: userIdentifier,
			ip,
			repo: repo.tag,
			file_path: selectedPath
		}).catch((e) => {
			console.error('failed to log audit entry', e);
		});
	}

	let noteContent = '';
	if (selectedPath && user) {
		const existing = await db.select()
			.from(note)
			.where(and(
				eq(note.userId, user.id),
				eq(note.repoTag, repo.tag),
				eq(note.filePath, selectedPath)
			))
			.limit(1);
		if (existing.length > 0) {
			noteContent = existing[0].content;
		}
	}

	return {
		repo,
		tree,
		selectedPath,
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

		const repo = await getRepoByTag(params.repoTag);

		await db.insert(note).values({
			userId: locals.user.id,
			repoTag: repo.tag,
			filePath,
			content,
			updatedAt: new Date()
		}).onConflictDoUpdate({
			target: [note.userId, note.repoTag, note.filePath],
			set: { content, updatedAt: new Date() }
		});

		return { success: true };
	}
};
