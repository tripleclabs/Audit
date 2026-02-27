<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Search, Loader2, X } from '@lucide/svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import type { PageData } from './$types';

	type SearchMatch = { lineNumber: number; content: string };
	type SearchResult = { filePath: string; repoName: string; language: string; score: number; matches: SearchMatch[] };

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let searchResults = $state<SearchResult[]>([]);
	let searching = $state(false);
	let searchActive = $state(false);
	let searchError = $state('');

	async function doSearch(updateUrl = true) {
		const q = searchQuery.trim();
		if (q.length < 2) return;

		searching = true;
		searchError = '';
		searchActive = true;

		if (updateUrl) {
			const url = new URL($page.url);
			url.searchParams.set('q', q);
			goto(url.toString(), { replaceState: false, keepFocus: true, noScroll: true });
		}

		try {
			const res = await fetch(`/api/projects/${data.project.slug}/search?q=${encodeURIComponent(q)}`);
			if (!res.ok) {
				searchError = 'Search failed';
				searchResults = [];
				return;
			}
			const json = await res.json();
			searchResults = json.results;
		} catch {
			searchError = 'Search failed';
			searchResults = [];
		} finally {
			searching = false;
		}
	}

	function clearSearch() {
		searchQuery = '';
		searchResults = [];
		searchActive = false;
		searchError = '';
		const url = new URL($page.url);
		url.searchParams.delete('q');
		goto(url.toString(), { replaceState: true, keepFocus: true, noScroll: true });
	}

	// Restore search from URL on mount / back navigation
	onMount(() => {
		const q = $page.url.searchParams.get('q');
		if (q) {
			searchQuery = q;
			doSearch(false);
		}
	});
</script>

<main class="mx-auto min-h-screen w-full max-w-5xl px-4 py-12">
	<div class="mb-8">
		<a href="/" class="text-sm text-blue-700 hover:underline">&larr; All projects</a>
		<h1 class="mt-2 text-2xl font-semibold tracking-tight">{data.project.name}</h1>
		<p class="mt-1 text-sm text-muted-foreground">{data.project.repos.length} {data.project.repos.length === 1 ? 'repository' : 'repositories'}</p>
	</div>

	<div class="relative mb-6">
		<Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
		<Input
			placeholder="Search across all repositories..."
			class="pl-10 pr-10"
			bind:value={searchQuery}
			onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter') doSearch(); if (e.key === 'Escape') clearSearch(); }}
		/>
		{#if searchActive}
			<button
				class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
				onclick={clearSearch}
			>
				<X class="h-4 w-4" />
			</button>
		{/if}
	</div>

	{#if searchActive}
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
				{#if searching}
					<span class="flex items-center gap-1.5">
						<Loader2 class="h-3.5 w-3.5 animate-spin" />
						Searching...
					</span>
				{:else if searchError}
					{searchError}
				{:else}
					{searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
				{/if}
			</h2>
			<Button variant="ghost" size="sm" onclick={clearSearch}>Clear search</Button>
		</div>

		{#if !searching && !searchError && searchResults.length === 0}
			<p class="text-sm text-muted-foreground">No results found.</p>
		{/if}

		<div class="space-y-1">
			{#each searchResults as result}
				<a
					href={`/projects/${data.project.slug}/${result.repoName}?path=${encodeURIComponent(result.filePath)}${result.matches[0] ? `&line=${result.matches[0].lineNumber}` : ''}`}
					class="block rounded-lg border border-border p-3 transition-colors hover:bg-secondary"
				>
					<div class="flex items-baseline justify-between gap-3">
						<div class="flex items-baseline gap-2 truncate">
							<Badge variant="outline" class="shrink-0 text-[10px]">{result.repoName}</Badge>
							<span class="truncate font-mono text-sm">{result.filePath}</span>
						</div>
						<span class="shrink-0 text-xs text-muted-foreground">{result.language}</span>
					</div>
					{#each result.matches.slice(0, 3) as match}
						<div class="mt-1 truncate font-mono text-xs text-muted-foreground">
							<span class="text-muted-foreground/60">{match.lineNumber}:</span> {match.content.trim()}
						</div>
					{/each}
				</a>
			{/each}
		</div>
	{:else}
		<Separator class="mb-8" />

		<h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Repositories</h2>

		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.project.repos as repo}
				{@const key = `${data.project.slug}/${repo.owner}/${repo.name}`}
				{@const count = data.noteCounts?.[key] ?? 0}
				<a href={`/projects/${data.project.slug}/${repo.name}`} class="group">
					<Card class="transition-shadow hover:shadow-md">
						<CardHeader class="pb-2">
							<div class="flex items-center justify-between">
								<CardTitle class="text-base">{repo.name}</CardTitle>
								{#if count > 0}
									<Badge variant="secondary">{count} {count === 1 ? 'note' : 'notes'}</Badge>
								{/if}
							</div>
							<CardDescription class="font-mono text-xs">
								{repo.owner}/{repo.name}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div class="flex items-center gap-1.5">
								<svg class="h-3.5 w-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<line x1="6" y1="3" x2="6" y2="15" />
									<circle cx="18" cy="6" r="3" />
									<circle cx="6" cy="18" r="3" />
									<path d="M18 9a9 9 0 0 1-9 9" />
								</svg>
								<span class="text-xs text-muted-foreground">{repo.tag}</span>
							</div>
						</CardContent>
						{#if count > 0}
							<CardFooter class="pt-0">
								<a href={`/projects/${data.project.slug}/${repo.name}/notes`} class="text-xs text-blue-600 hover:underline" onclick={(e) => e.stopPropagation()}>
									View notes
								</a>
							</CardFooter>
						{/if}
					</Card>
				</a>
			{/each}
		</div>
	{/if}
</main>
