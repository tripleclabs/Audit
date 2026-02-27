import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getRepoConfigs } from '$lib/server/config';
import { auth } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session ? { ...locals.session, user: locals.user } : null;

	return {
		session,
		repos: locals.session ? await getRepoConfigs() : []
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
