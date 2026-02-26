import type { Actions, PageServerLoad } from './$types';
import { getRepoConfigs } from '$lib/server/config';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();

	return {
		session,
		repos: session ? await getRepoConfigs() : []
	};
};

export const actions: Actions = {
	signin: async (event) => {
		await event.locals.signIn('github', { redirectTo: '/' });
	},
	signout: async (event) => {
		await event.locals.signOut({ redirectTo: '/' });
	}
};
