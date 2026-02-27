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
						<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 460px; margin: 40px auto; color: #0f172a;">
							<div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 32px;">
								<p style="margin: 0 0 8px; font-size: 15px; color: #64748b;">Audit Portal</p>
								<p style="margin: 0 0 24px; font-size: 17px;">Use the link below to sign in to your account.</p>
								<a href="${url}" style="display: inline-block; padding: 10px 20px; background: #1e293b; color: #f8fafc; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">Sign in</a>
								<p style="margin: 24px 0 0; font-size: 13px; color: #94a3b8;">This link expires in 10 minutes. If you didn't request this, ignore this email.</p>
							</div>
						</div>
					`
				});
			}
		})
	]
});
