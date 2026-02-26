<script lang="ts">
	import ReadonlyCode from '$lib/components/ReadonlyCode.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const files = $derived(data.tree.filter((node) => node.type === 'blob'));
</script>

<div class="grid w-full grid-cols-[300px_1fr] gap-4">
	<aside class="h-[80vh] overflow-auto rounded border border-border bg-slate-50 p-3">
		<a href="/" class="text-sm text-blue-700 hover:underline">← Back to repositories</a>
		<h1 class="mt-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{data.repo.tag}</h1>
		<p class="text-xs text-slate-500">{data.repo.owner}/{data.repo.name}@{data.repo.branch}</p>

		<ul class="mt-4 space-y-1 text-sm">
			{#each files as node}
				<li>
					<a
						href={`/repos/${data.repo.tag}?path=${encodeURIComponent(node.path)}`}
						class={`block truncate rounded px-2 py-1 hover:bg-slate-200 ${data.selectedPath === node.path ? 'bg-slate-200 font-medium' : ''}`}
						title={node.path}
					>
						{node.path}
					</a>
				</li>
			{/each}
		</ul>
	</aside>

	<section class="h-[80vh] overflow-hidden rounded border border-border bg-slate-900 p-2">
		{#if data.selectedPath}
			<div class="mb-2 border-b border-slate-700 pb-2 font-mono text-xs text-slate-300">{data.selectedPath}</div>
			<ReadonlyCode filePath={data.selectedPath} content={data.selectedContent} />
		{:else}
			<div class="flex h-full items-center justify-center text-sm text-slate-400">
				Select a file in the left panel to inspect it.
			</div>
		{/if}
	</section>
</div>
