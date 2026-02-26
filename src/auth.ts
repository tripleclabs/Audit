import { AUTH_SECRET, GITHUB_ID, GITHUB_SECRET } from '$env/static/private';
import { SvelteKitAuth } from '@auth/sveltekit';
import GitHub from '@auth/sveltekit/providers/github';

export const { handle, signIn, signOut } = SvelteKitAuth({
	secret: AUTH_SECRET,
	providers: [
		GitHub({
			clientId: GITHUB_ID,
			clientSecret: GITHUB_SECRET
		})
	],
	trustHost: true
});
