import type { Actions, PageServerLoad } from './$types';
import { getRepoConfigs } from '$lib/server/config';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session ?? null;

	return {
		session,
		repos: session ? await getRepoConfigs() : []
	};
};

export const actions: Actions = {
	signin: async () => {
		// redirect user to the new signin route
		return { redirect: '/signin' } as unknown as void;
	},
	signout: async () => {
		// demo signout redirect; better-auth provides its own endpoints
		return { redirect: '/signin' } as unknown as void;
	}
};
