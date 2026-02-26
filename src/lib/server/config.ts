import { readFile } from 'node:fs/promises';
import { error } from '@sveltejs/kit';

export type RepoConfig = {
	tag: string;
	owner: string;
	name: string;
	branch: string;
};

let usersCache: string[] | null = null;
let reposCache: RepoConfig[] | null = null;

const loadJson = async <T>(path: string): Promise<T> => {
	const raw = await readFile(path, 'utf-8');
	return JSON.parse(raw) as T;
};

export const getAllowedUsers = async (): Promise<string[]> => {
	if (!usersCache) {
		const users = await loadJson<string[]>('config/users.json');
		usersCache = users.map((username) => username.toLowerCase());
	}

	return usersCache;
};

export const getRepoConfigs = async (): Promise<RepoConfig[]> => {
	if (!reposCache) {
		reposCache = await loadJson<RepoConfig[]>('config/repos.json');
	}

	return reposCache;
};

export const getRepoByTag = async (tag: string): Promise<RepoConfig> => {
	const repos = await getRepoConfigs();
	const repo = repos.find((entry) => entry.tag === tag);

	if (!repo) {
		throw error(404, `Unknown repository tag: ${tag}`);
	}

	return repo;
};
