import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getProjectsForUser } from '$lib/server/config';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { note } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session ? { ...locals.session, user: locals.user } : null;

	let projects: Awaited<ReturnType<typeof getProjectsForUser>> = [];
	let noteCounts: Record<string, number> = {};

	if (locals.user) {
		projects = await getProjectsForUser(locals.user.email);

		if (projects.length > 0) {
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
	}

	return {
		session,
		projects,
		noteCounts
	};
};

export const actions: Actions = {
	signin: async () => {
		const result = await auth.api.signInSocial({
			body: {
				provider: 'github',
				callbackURL: '/'
			}
		});

		if (result.url) {
			throw redirect(302, result.url);
		}
	},
	signout: async ({ request }) => {
		await auth.api.signOut({ headers: request.headers });
		throw redirect(302, '/');
	}
};
