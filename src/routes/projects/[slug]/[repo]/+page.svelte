<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Search, Sun, Moon, X, Loader2 } from '@lucide/svelte';
	import ReadonlyCode from '$lib/components/ReadonlyCode.svelte';
	import FileTree from '$lib/components/FileTree.svelte';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Button } from '$components/ui/button';
	import {
		SidebarProvider,
		Sidebar,
		SidebarContent,
		SidebarHeader,
		SidebarGroup,
		SidebarGroupLabel,
		SidebarGroupContent,
		SidebarInset,
		SidebarTrigger,
		SidebarInput,
		SidebarRail
	} from '$lib/components/ui/sidebar';
	import { Separator } from '$lib/components/ui/separator';
	import {
		Breadcrumb,
		BreadcrumbList,
		BreadcrumbItem,
		BreadcrumbLink,
		BreadcrumbSeparator,
		BreadcrumbPage
	} from '$lib/components/ui/breadcrumb';
	import type { PageData } from './$types';

	type SearchMatch = { lineNumber: number; content: string };
	type SearchResult = { filePath: string; language: string; score: number; matches: SearchMatch[] };

	let { data }: { data: PageData } = $props();
	let saving = $state(false);
	let saved = $state(false);
	let darkTheme = $state(false);
	let formEl: HTMLFormElement | undefined = $state();

	// Search state
	let searchQuery = $state('');
	let searchResults = $state<SearchResult[]>([]);
	let searching = $state(false);
	let searchActive = $state(false);
	let searchError = $state('');

	const pathSegments = $derived(data.selectedPath ? data.selectedPath.split('/') : []);
	const basePath = $derived(`/projects/${data.project.slug}/${data.repo.name}`);
	const watermarkEmail = $derived(data.user?.email ?? '');

	async function doSearch(updateUrl = true) {
		const q = searchQuery.trim();
		if (q.length < 2) return;

		searching = true;
		searchError = '';
		searchActive = true;

		if (updateUrl) {
			const url = new URL($page.url);
			url.searchParams.set('q', q);
			url.searchParams.delete('path');
			goto(url.toString(), { replaceState: false, keepFocus: true, noScroll: true });
		}

		try {
			const res = await fetch(`/api/projects/${data.project.slug}/${data.repo.name}/search?q=${encodeURIComponent(q)}`);
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

	$effect(() => {
		if (darkTheme) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	});

	onMount(() => {
		// Restore search from URL on back navigation
		const q = $page.url.searchParams.get('q');
		if (q) {
			searchQuery = q;
			doSearch(false);
		}
		// Clean up dark class when leaving the page
		return () => document.documentElement.classList.remove('dark');
	});

	onMount(() => {
		function onKeydown(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key === 's') {
				e.preventDefault();
				if (formEl && data.selectedPath) {
					formEl.requestSubmit();
				}
			}
		}
		document.addEventListener('keydown', onKeydown);
		return () => document.removeEventListener('keydown', onKeydown);
	});
</script>

<SidebarProvider>
	<Sidebar variant="sidebar" collapsible="icon">
		<SidebarHeader>
			<div class="flex flex-col gap-0.5 px-2 py-1 group-data-[collapsible=icon]:hidden">
				<a href={`/projects/${data.project.slug}`} class="text-xs text-blue-700 hover:underline">&larr; {data.project.name}</a>
				<span class="text-sm font-semibold">{data.repo.name}</span>
				<span class="text-xs text-muted-foreground">{data.repo.owner}/{data.repo.name}@{data.repo.tag}</span>
			</div>
			<div class="relative px-2 group-data-[collapsible=icon]:hidden">
				<Search class="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
				<SidebarInput
					placeholder="Search code..."
					class="pl-8 pr-8"
					bind:value={searchQuery}
					onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter') doSearch(); if (e.key === 'Escape') clearSearch(); }}
				/>
				{#if searchActive}
					<button
						class="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
						onclick={clearSearch}
					>
						<X class="h-3.5 w-3.5" />
					</button>
				{/if}
			</div>
		</SidebarHeader>
		<SidebarContent class="group-data-[collapsible=icon]:hidden">
			{#if searchActive}
				<SidebarGroup>
					<SidebarGroupLabel>
						{#if searching}
							<span class="flex items-center gap-1.5">
								<Loader2 class="h-3 w-3 animate-spin" />
								Searching...
							</span>
						{:else if searchError}
							{searchError}
						{:else}
							Results ({searchResults.length})
						{/if}
					</SidebarGroupLabel>
					<SidebarGroupContent>
						{#if !searching && !searchError && searchResults.length === 0}
							<p class="px-4 py-2 text-xs text-muted-foreground">No results found.</p>
						{/if}
						<div class="space-y-0.5 px-2">
							{#each searchResults as result}
								<a
									href={`${basePath}?path=${encodeURIComponent(result.filePath)}${result.matches[0] ? `&line=${result.matches[0].lineNumber}` : ''}`}
									class="block rounded-md px-2 py-1.5 hover:bg-sidebar-accent {data.selectedPath === result.filePath ? 'bg-sidebar-accent' : ''}"
								>
									<div class="flex items-baseline justify-between gap-2">
										<span class="truncate text-xs font-medium">{result.filePath}</span>
										<span class="shrink-0 text-[10px] text-muted-foreground">{result.language}</span>
									</div>
									{#each result.matches.slice(0, 2) as match}
										<div class="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
											<span class="text-muted-foreground/60">{match.lineNumber}:</span> {match.content.trim()}
										</div>
									{/each}
								</a>
							{/each}
						</div>
					</SidebarGroupContent>
				</SidebarGroup>
			{:else}
				<SidebarGroup>
					<SidebarGroupLabel>Files</SidebarGroupLabel>
					<SidebarGroupContent>
						<FileTree tree={data.tree} selectedPath={data.selectedPath} basePath={basePath} />
					</SidebarGroupContent>
				</SidebarGroup>
			{/if}
		</SidebarContent>
		<SidebarRail />
	</Sidebar>

	<SidebarInset>
		<header class="flex h-10 shrink-0 items-center gap-2 border-b px-4">
			<SidebarTrigger class="-ml-1" />
			<Separator orientation="vertical" class="mr-2 !h-4" />
			{#if data.selectedPath}
				<Breadcrumb>
					<BreadcrumbList>
						{#each pathSegments as segment, i}
							{#if i < pathSegments.length - 1}
								<BreadcrumbItem class="hidden md:block">
									<BreadcrumbLink href="#">{segment}</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator class="hidden md:block" />
							{:else}
								<BreadcrumbItem>
									<BreadcrumbPage>{segment}</BreadcrumbPage>
								</BreadcrumbItem>
							{/if}
						{/each}
					</BreadcrumbList>
				</Breadcrumb>
			{:else}
				<span class="text-sm text-muted-foreground">Select a file</span>
			{/if}
			<div class="ml-auto">
				<Button variant="ghost" size="sm" class="h-7 w-7 p-0" onclick={() => { darkTheme = !darkTheme; }}>
					{#if darkTheme}
						<Sun class="h-4 w-4" />
					{:else}
						<Moon class="h-4 w-4" />
					{/if}
					<span class="sr-only">Toggle code theme</span>
				</Button>
			</div>
		</header>

		<div class="flex h-[calc(100vh-2.5rem)] min-w-0 flex-col">
			<section class="relative flex-1 overflow-auto bg-secondary p-2">
				{#if data.selectedPath}
					<ReadonlyCode filePath={data.selectedPath} content={data.selectedContent} dark={darkTheme} line={data.selectedLine} />
				{:else}
					<div class="flex h-full items-center justify-center text-sm text-muted-foreground">
						Select a file in the sidebar to inspect it.
					</div>
				{/if}
				{#if watermarkEmail}
					<div
						class="pointer-events-none absolute inset-0 overflow-hidden"
						aria-hidden="true"
						style="
							background-image: url(&quot;data:image/svg+xml,{encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200'><text transform='rotate(-25 200 100)' x='50%' y='50%' text-anchor='middle' font-family='monospace' font-size='14' fill='${darkTheme ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}' dominant-baseline='middle'>${watermarkEmail}</text></svg>`)}&quot;);
							background-repeat: repeat;
						"
					></div>
				{/if}
			</section>

			{#if data.selectedPath}
				<section class="h-44 shrink-0 border-t border-border bg-background p-3">
					<form
						bind:this={formEl}
						method="post"
						action="?/saveNote"
						use:enhance={() => {
							saving = true;
							saved = false;
							return async ({ update }) => {
								await update();
								saving = false;
								saved = true;
								setTimeout(() => { saved = false; }, 2000);
							};
						}}
					>
						<input type="hidden" name="filePath" value={data.selectedPath} />
						<label for="note-content" class="mb-1 block text-xs font-medium text-muted-foreground">Notes for this file</label>
						<Textarea
							id="note-content"
							name="content"
							rows={3}
							placeholder="Add your notes for this file..."
							value={data.noteContent}
							class="mb-2 resize-none h-16"
						/>
						<div class="flex items-center gap-2">
							<Button type="submit" size="sm" disabled={saving}>
								{saving ? 'Saving...' : 'Save note'}
							</Button>
							{#if saved}
								<span class="text-xs text-green-600">Saved</span>
							{/if}
						</div>
					</form>
				</section>
			{/if}
		</div>
	</SidebarInset>
</SidebarProvider>
