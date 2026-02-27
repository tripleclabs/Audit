import { error, json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRepoByTag } from '$lib/server/config';
import { getFileFromRepo } from '$lib/server/github';
import { db } from '$lib/server/db';
import { audit } from '$lib/server/db/schema';

export const GET: RequestHandler = async ({ locals, params, url, request }) => {
	const session = locals.session ?? null;
	if (!session) {
		throw redirect(303, '/');
	}
	// user info is stored separately on locals
	const user = locals.user ?? null;

	const path = url.searchParams.get('path');
	if (!path) {
		throw error(400, 'Missing required query param: path');
	}

	const repo = await getRepoByTag(params.repoTag);
	const content = await getFileFromRepo(repo, path);

	// determine client IP (behind proxies may use x-forwarded-for)
	const rawIp =
		request.headers.get('x-forwarded-for') ||
		request.headers.get('x-real-ip') ||
		'unknown';
	const ip = rawIp.split(',')[0].trim() || 'unknown';

	// user identifier from locals.user (email, name or id)
	const userIdentifier =
		user?.email || user?.name || user?.id || 'unknown';

	// write audit entry asynchronously (don't block response)
	db.insert(audit).values({
		user: userIdentifier,
		ip,
		repo: repo.tag,
		file_path: path
	}).catch((e) => {
		console.error('failed to log audit entry', e);
	});

	return json({ path, content });
};
