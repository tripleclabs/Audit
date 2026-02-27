import { readFile } from 'node:fs/promises';
import { error } from '@sveltejs/kit';
import { parse } from 'yaml';

export type RepoConfig = {
	owner: string;
	name: string;
	tag: string;
};

export type ProjectConfig = {
	name: string;
	slug: string;
	repos: RepoConfig[];
	users: string[];
};

function parseRepoString(s: string): RepoConfig {
	const [ownerName, tag] = s.split('@');
	const [owner, name] = ownerName.split('/');
	if (!owner || !name) {
		throw new Error(`Invalid repo format: "${s}". Expected "owner/name@tag".`);
	}
	return { owner, name, tag: tag ?? 'main' };
}

let projectsCache: ProjectConfig[] | null = null;
let projectsCacheTime = 0;
const CACHE_TTL_MS = 60_000;

export async function getProjects(): Promise<ProjectConfig[]> {
	if (!projectsCache || Date.now() - projectsCacheTime > CACHE_TTL_MS) {
		const raw = await readFile('config/projects.yaml', 'utf-8');
		const data = parse(raw) as { projects: Array<{ name: string; slug: string; repos: string[]; users: string[] }> };
		projectsCache = data.projects.map((p) => ({
			name: p.name,
			slug: p.slug,
			repos: (p.repos ?? []).map(parseRepoString),
			users: (p.users ?? []).map((u) => u.toLowerCase())
		}));
		projectsCacheTime = Date.now();
	}
	return projectsCache;
}

export async function getProjectBySlug(slug: string): Promise<ProjectConfig> {
	const projects = await getProjects();
	const project = projects.find((p) => p.slug === slug);
	if (!project) throw error(404, `Unknown project: ${slug}`);
	return project;
}

export async function getProjectsForUser(username: string): Promise<ProjectConfig[]> {
	const projects = await getProjects();
	const lower = username.toLowerCase();
	return projects.filter((p) => p.users.includes(lower));
}

export function getRepoInProject(project: ProjectConfig, repoName: string): RepoConfig {
	const repo = project.repos.find((r) => r.name === repoName);
	if (!repo) throw error(404, `Unknown repo "${repoName}" in project "${project.slug}"`);
	return repo;
}

/** Unique key for a repo within a project (used for cloning path, note storage, etc.) */
export function repoKey(projectSlug: string, repo: RepoConfig): string {
	return `${projectSlug}/${repo.owner}/${repo.name}`;
}
