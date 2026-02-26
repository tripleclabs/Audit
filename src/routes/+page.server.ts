import { signIn, signOut } from '../auth';
import type { Actions } from './$types';

export const actions: Actions = {
	signin: async (event) => {
		await signIn(event, 'github', { redirectTo: '/' });
	},
	signout: async (event) => {
		await signOut(event, { redirectTo: '/' });
	}
};
