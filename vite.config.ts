import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const port = Number(process.env.PORT || "7173");

export default defineConfig({
	plugins: [sentrySvelteKit(), sveltekit()],
	server: {
		port,
		watch: {
			ignored: ['**/data/**']
		}
	},
	preview: {
		port
	}
});
