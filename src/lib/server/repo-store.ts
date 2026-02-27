import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import { simpleGit } from 'simple-git';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { readFile, readdir, writeFile, access, mkdir } from 'fs/promises';
import { resolve, join, relative } from 'path';
import type { RepoConfig } from './config';
import { repoKey } from './config';

const execFileAsync = promisify(execFile);

export type TreeNode = {
	path: string;
	type: 'blob' | 'tree';
};

const DATA_DIR = resolve(env.DATA_DIR || 'data/repos');
const treeCache = new Map<string, TreeNode[]>();
const cloneLocks = new Map<string, Promise<void>>();

function repoDir(key: string): string {
	return join(DATA_DIR, key);
}

async function exists(p: string): Promise<boolean> {
	try {
		await access(p);
		return true;
	} catch {
		return false;
	}
}

async function walkDir(dir: string, base: string): Promise<TreeNode[]> {
	const entries: TreeNode[] = [];
	const items = await readdir(dir, { withFileTypes: true });

	for (const item of items) {
		if (item.name === '.git' || item.name === '.tree.json' || item.name === '.repo-meta.json' || item.name === '.claude' || item.name === '.vscode') continue;
		const fullPath = join(dir, item.name);
		const relPath = relative(base, fullPath);

		if (item.isDirectory()) {
			entries.push({ path: relPath, type: 'tree' });
			const children = await walkDir(fullPath, base);
			entries.push(...children);
		} else if (item.isFile()) {
			entries.push({ path: relPath, type: 'blob' });
		}
	}

	return entries;
}

export async function ensureCloned(projectSlug: string, repo: RepoConfig): Promise<string> {
	const key = repoKey(projectSlug, repo);
	const dir = repoDir(key);

	if (treeCache.has(key)) return dir;

	const existing = cloneLocks.get(key);
	if (existing) {
		await existing;
		return dir;
	}

	const doWork = async () => {
		const metaFile = join(dir, '.repo-meta.json');
		const treeFile = join(dir, '.tree.json');
		let needsClone = true;

		if (await exists(metaFile)) {
			const meta = JSON.parse(await readFile(metaFile, 'utf-8'));
			if (meta.tag === repo.tag && await exists(treeFile)) {
				const raw = await readFile(treeFile, 'utf-8');
				treeCache.set(key, JSON.parse(raw));
				return;
			}
			// Tag mismatch or missing tree — wipe and re-clone
		} else if (await exists(treeFile)) {
			// Legacy: no meta file but tree exists — migrate by re-cloning
		}

		// Remove stale/partial directory before cloning
		if (await exists(dir)) {
			const { rm } = await import('fs/promises');
			await rm(dir, { recursive: true, force: true });
		}

		const token = env.GITHUB_API_TOKEN;
		const cloneUrl = token
			? `https://x-access-token:${token}@github.com/${repo.owner}/${repo.name}.git`
			: `https://github.com/${repo.owner}/${repo.name}.git`;

		await mkdir(dir, { recursive: true });

		const git = simpleGit();
		await git.clone(cloneUrl, dir, [
			'--branch', repo.tag,
			'--single-branch',
			'--depth', '1'
		]);

		const tree = await walkDir(dir, dir);
		treeCache.set(key, tree);
		await writeFile(treeFile, JSON.stringify(tree));
		await writeFile(metaFile, JSON.stringify({ tag: repo.tag }));
	};

	const promise = doWork();
	cloneLocks.set(key, promise);
	try {
		await promise;
	} finally {
		cloneLocks.delete(key);
	}

	return dir;
}

export async function getTree(projectSlug: string, repo: RepoConfig): Promise<TreeNode[]> {
	await ensureCloned(projectSlug, repo);
	return treeCache.get(repoKey(projectSlug, repo)) ?? [];
}

export async function getFileContent(projectSlug: string, repo: RepoConfig, filePath: string): Promise<string> {
	const dir = await ensureCloned(projectSlug, repo);
	const resolved = resolve(dir, filePath);

	if (!resolved.startsWith(dir + '/')) {
		throw error(403, 'Invalid file path');
	}

	try {
		return await readFile(resolved, 'utf-8');
	} catch {
		throw error(404, 'File not found');
	}
}

export type SearchMatch = {
	lineNumber: number;
	content: string;
};

export type SearchResult = {
	filePath: string;
	repoName?: string;
	language: string;
	score: number;
	matches: SearchMatch[];
};

const CS_BIN = env.CS_BIN || 'cs';

export async function searchRepo(
	projectSlug: string,
	repo: RepoConfig,
	query: string
): Promise<SearchResult[]> {
	const dir = await ensureCloned(projectSlug, repo);

	try {
		const { stdout } = await execFileAsync(CS_BIN, [query, '-f', 'json', '--dir', dir, '--exclude-dir', '.claude,.vscode'], {
			timeout: 10_000,
			maxBuffer: 5 * 1024 * 1024
		});

		if (!stdout.trim()) return [];

		const raw = JSON.parse(stdout) as Array<{
			filename: string;
			location: string;
			score: number;
			language: string;
			lines: Array<{ line_number: number; content: string }>;
		}>;

		const PREFERRED_LANGUAGES = ['Swift'];
		const BOOST = 10.0;

		const results = raw.map((entry) => ({
			filePath: relative(dir, entry.location),
			language: entry.language,
			score: PREFERRED_LANGUAGES.includes(entry.language) ? entry.score * BOOST : entry.score,
			matches: (entry.lines ?? [])
				.filter((l) => l.content?.trim().length > 0)
				.slice(0, 5)
				.map((l) => ({
					lineNumber: l.line_number,
					content: l.content
				}))
		}));

		results.sort((a, b) => b.score - a.score);
		return results.slice(0, 100);
	} catch (e: unknown) {
		// cs exits with code 1 when no results found
		if (e && typeof e === 'object' && 'code' in e && (e as { code: number }).code === 1) {
			return [];
		}
		console.error('Search failed:', e);
		return [];
	}
}

export async function searchProject(
	projectSlug: string,
	repos: RepoConfig[],
	query: string
): Promise<SearchResult[]> {
	// Ensure all repos are cloned first
	await Promise.all(repos.map((repo) => ensureCloned(projectSlug, repo)));

	const projectDir = join(DATA_DIR, projectSlug);

	try {
		const { stdout } = await execFileAsync(CS_BIN, [query, '-f', 'json', '--dir', projectDir, '--exclude-dir', '.claude,.vscode'], {
			timeout: 15_000,
			maxBuffer: 10 * 1024 * 1024
		});

		if (!stdout.trim()) return [];

		const raw = JSON.parse(stdout) as Array<{
			filename: string;
			location: string;
			score: number;
			language: string;
			lines: Array<{ line_number: number; content: string }>;
		}>;

		const PREFERRED_LANGUAGES = ['Swift'];
		const BOOST = 10.0;

		const results = raw.map((entry) => {
			const relFromProject = relative(projectDir, entry.location);
			// relFromProject is like "owner/repoName/path/to/file"
			// Find which repo this belongs to
			let repoName = '';
			let filePath = relFromProject;
			for (const repo of repos) {
				const repoPrefix = `${repo.owner}/${repo.name}/`;
				if (relFromProject.startsWith(repoPrefix)) {
					repoName = repo.name;
					filePath = relFromProject.slice(repoPrefix.length);
					break;
				}
			}

			return {
				filePath,
				repoName,
				language: entry.language,
				score: PREFERRED_LANGUAGES.includes(entry.language) ? entry.score * BOOST : entry.score,
				matches: (entry.lines ?? [])
					.filter((l) => l.content?.trim().length > 0)
					.slice(0, 5)
					.map((l) => ({
						lineNumber: l.line_number,
						content: l.content
					}))
			};
		});

		results.sort((a, b) => b.score - a.score);
		return results.slice(0, 100);
	} catch (e: unknown) {
		if (e && typeof e === 'object' && 'code' in e && (e as { code: number }).code === 1) {
			return [];
		}
		console.error('Project search failed:', e);
		return [];
	}
}
