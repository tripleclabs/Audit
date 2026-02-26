import { AUTH_SECRET, GITHUB_ID, GITHUB_SECRET } from '$env/static/private';
import { SvelteKitAuth } from '@auth/sveltekit';
import GitHub from '@auth/sveltekit/providers/github';
import { getAllowedUsers } from '$lib/server/config';

export const { handle, signIn, signOut } = SvelteKitAuth({
	secret: AUTH_SECRET,
	providers: [
		GitHub({
			clientId: GITHUB_ID,
			clientSecret: GITHUB_SECRET
		})
	],
	callbacks: {
		signIn: async ({ profile }) => {
			const login = typeof profile?.login === 'string' ? profile.login.toLowerCase() : null;
			if (!login) {
				return false;
			}

			const allowedUsers = await getAllowedUsers();
			return allowedUsers.includes(login);
		}
	},
	trustHost: true
});
