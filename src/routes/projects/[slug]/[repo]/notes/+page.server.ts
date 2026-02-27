import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getProjectBySlug, getRepoInProject, repoKey } from '$lib/server/config';
import { db } from '$lib/server/db';
import { note } from '$lib/server/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) throw redirect(303, '/');

	const project = await getProjectBySlug(params.slug);
	if (!project.users.includes(locals.user.email.toLowerCase())) {
		throw error(403, 'You do not have access to this project');
	}

	const repo = getRepoInProject(project, params.repo);
	const rk = repoKey(project.slug, repo);

	const notes = await db
		.select({
			filePath: note.filePath,
			content: note.content,
			updatedAt: note.updatedAt
		})
		.from(note)
		.where(and(eq(note.userId, locals.user.id), eq(note.repoTag, rk)))
		.orderBy(asc(note.filePath));

	return { project, repo, notes };
};
