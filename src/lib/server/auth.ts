import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { magicLink } from 'better-auth/plugins';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import nodemailer from 'nodemailer';

function getMailTransport() {
	if (!env.SMTP_HOST) return null;
	return nodemailer.createTransport({
		host: env.SMTP_HOST,
		port: Number(env.SMTP_PORT || '587'),
		secure: env.SMTP_SECURE === 'true',
		auth: {
			user: env.SMTP_USER,
			pass: env.SMTP_PASS
		}
	});
}

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	emailAndPassword: { enabled: false },
	socialProviders: {
		github: {
			clientId: env.GITHUB_CLIENT_ID,
			clientSecret: env.GITHUB_CLIENT_SECRET
		}
	},
	plugins: [
		sveltekitCookies(getRequestEvent),
		magicLink({
			sendMagicLink: async ({ email, url }) => {
				const transport = getMailTransport();
				if (!transport) {
					console.log(`\n[dev] Magic link for ${email}: ${url}\n`);
					return;
				}

				await transport.sendMail({
					from: env.SMTP_FROM || env.SMTP_USER,
					to: email,
					subject: 'Sign in to Audit Portal',
					html: `
						<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
							<h2>Sign in to Audit Portal</h2>
							<p>Click the link below to sign in. This link expires in 10 minutes.</p>
							<p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#18181b;color:#fff;text-decoration:none;border-radius:6px;">Sign In</a></p>
							<p style="color:#666;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
						</div>
					`
				});
			}
		})
	]
});
