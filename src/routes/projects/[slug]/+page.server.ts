import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getProjectBySlug } from '$lib/server/config';
import { repoKey } from '$lib/server/config';
import { db } from '$lib/server/db';
import { note } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) throw redirect(303, '/');

	const project = await getProjectBySlug(params.slug);
	if (!project.users.includes(locals.user.email.toLowerCase())) {
		throw error(403, 'You do not have access to this project');
	}

	// Get note counts per repo
	let noteCounts: Record<string, number> = {};
	if (project.repos.length > 0) {
		const counts = await db
			.select({
				repoTag: note.repoTag,
				count: sql<number>`count(*)::int`
			})
			.from(note)
			.where(eq(note.userId, locals.user.id))
			.groupBy(note.repoTag);

		for (const row of counts) {
			noteCounts[row.repoTag] = row.count;
		}
	}

	return { project, noteCounts };
};
