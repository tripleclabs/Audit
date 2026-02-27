import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getRepoByTag } from '$lib/server/config';
import { db } from '$lib/server/db';
import { note } from '$lib/server/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) throw redirect(303, '/');

	const repo = await getRepoByTag(params.repoTag);

	const notes = await db.select({
		filePath: note.filePath,
		content: note.content,
		updatedAt: note.updatedAt
	})
		.from(note)
		.where(and(
			eq(note.userId, locals.user.id),
			eq(note.repoTag, repo.tag)
		))
		.orderBy(asc(note.filePath));

	return { repo, notes };
};
