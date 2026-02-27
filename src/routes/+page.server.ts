import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getRepoConfigs } from '$lib/server/config';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { note } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session ? { ...locals.session, user: locals.user } : null;
	const repos = locals.session ? await getRepoConfigs() : [];

	let noteCounts: Record<string, number> = {};
	if (locals.user && repos.length > 0) {
		const counts = await db.select({
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

	return {
		session,
		repos,
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
	signout: async () => {
		throw redirect(302, '/api/auth/sign-out');
	}
};
