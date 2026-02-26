import { GITHUB_API_TOKEN } from '$env/static/private';
import { error } from '@sveltejs/kit';
import type { RepoConfig } from './config';

export type TreeNode = {
	path: string;
	type: 'blob' | 'tree';
};

type CacheEntry<T> = {
	expiresAt: number;
	value: T;
};

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, CacheEntry<unknown>>();

const getCached = <T>(key: string): T | null => {
	const entry = cache.get(key);
	if (!entry || entry.expiresAt < Date.now()) {
		cache.delete(key);
		return null;
	}
	return entry.value as T;
};

const setCached = <T>(key: string, value: T): T => {
	cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, value });
	return value;
};

const githubFetch = async <T>(path: string): Promise<T> => {
	const cached = getCached<T>(path);
	if (cached) {
		return cached;
	}

	const headers: Record<string, string> = {
		Accept: 'application/vnd.github+json',
		'X-GitHub-Api-Version': '2022-11-28'
	};

	if (GITHUB_API_TOKEN) {
		headers.Authorization = `Bearer ${GITHUB_API_TOKEN}`;
	}

	const response = await fetch(`https://api.github.com${path}`, { headers });
	if (!response.ok) {
		throw error(response.status, `GitHub API error for ${path}`);
	}

	const payload = (await response.json()) as T;
	return setCached(path, payload);
};

export const getTreeForRepo = async (repo: RepoConfig): Promise<TreeNode[]> => {
	const branch = await githubFetch<{ commit: { sha: string } }>(
		`/repos/${repo.owner}/${repo.name}/branches/${repo.branch}`
	);
	const tree = await githubFetch<{ tree: Array<{ path: string; type: 'blob' | 'tree' }> }>(
		`/repos/${repo.owner}/${repo.name}/git/trees/${branch.commit.sha}?recursive=1`
	);

	return tree.tree.filter((entry) => entry.type === 'blob' || entry.type === 'tree');
};

export const getFileFromRepo = async (repo: RepoConfig, path: string): Promise<string> => {
	const encodedPath = path
		.split('/')
		.map((segment) => encodeURIComponent(segment))
		.join('/');

	const file = await githubFetch<{ content?: string; encoding?: string }>(
		`/repos/${repo.owner}/${repo.name}/contents/${encodedPath}?ref=${encodeURIComponent(repo.branch)}`
	);

	if (!file.content || file.encoding !== 'base64') {
		throw error(404, 'File not found or unsupported encoding');
	}

	return Buffer.from(file.content, 'base64').toString('utf-8');
};
