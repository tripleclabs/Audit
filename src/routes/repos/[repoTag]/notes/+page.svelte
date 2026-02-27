<script lang="ts">
	import { Button } from '$components/ui/button';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function downloadMarkdown() {
		const lines = [`# Audit Notes: ${data.repo.tag}`, `> ${data.repo.owner}/${data.repo.name}@${data.repo.branch}`, ''];
		for (const n of data.notes) {
			lines.push(`## ${n.filePath}`, '', n.content, '');
		}
		const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${data.repo.tag}-notes.md`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="mx-auto max-w-3xl space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<a href={`/repos/${data.repo.tag}`} class="text-sm text-blue-700 hover:underline">← Back to {data.repo.tag}</a>
			<h1 class="mt-1 text-xl font-semibold">Audit Notes</h1>
			<p class="text-sm text-slate-500">{data.repo.owner}/{data.repo.name}@{data.repo.branch}</p>
		</div>
		{#if data.notes.length > 0}
			<Button onclick={downloadMarkdown} variant="secondary" size="sm">Download as Markdown</Button>
		{/if}
	</div>

	{#if data.notes.length === 0}
		<p class="text-sm text-slate-400">No notes yet. Start reviewing files to add notes.</p>
	{:else}
		<div class="space-y-4">
			{#each data.notes as n}
				<div class="rounded border border-border bg-white p-4">
					<a
						href={`/repos/${data.repo.tag}?path=${encodeURIComponent(n.filePath)}`}
						class="font-mono text-sm font-medium text-blue-700 hover:underline"
					>
						{n.filePath}
					</a>
					<p class="mt-2 whitespace-pre-wrap text-sm text-slate-700">{n.content}</p>
				</div>
			{/each}
		</div>
	{/if}
</div>
