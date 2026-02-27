<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<main class="mx-auto min-h-screen w-full max-w-5xl px-4 py-12">
	<div class="mb-8">
		<a href="/" class="text-sm text-blue-700 hover:underline">&larr; All projects</a>
		<h1 class="mt-2 text-2xl font-semibold tracking-tight">{data.project.name}</h1>
		<p class="mt-1 text-sm text-muted-foreground">{data.project.repos.length} {data.project.repos.length === 1 ? 'repository' : 'repositories'}</p>
	</div>

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
				</Card>
			</a>
		{/each}
	</div>
</main>
