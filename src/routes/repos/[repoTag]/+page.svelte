<script lang="ts">
	import { enhance } from '$app/forms';
	import ReadonlyCode from '$lib/components/ReadonlyCode.svelte';
	import FileTree from '$lib/components/FileTree.svelte';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Button } from '$components/ui/button';
	import type { PageData } from './$types';

	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();
	let saving = $state(false);
	let saved = $state(false);
	let formEl: HTMLFormElement | undefined = $state();

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

<div class="grid w-full grid-cols-[300px_1fr] gap-4">
	<aside class="h-[80vh] overflow-auto rounded border border-border bg-slate-50 p-3">
		<a href="/" class="text-sm text-blue-700 hover:underline">← Back to repositories</a>
		<h1 class="mt-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{data.repo.tag}</h1>
		<p class="text-xs text-slate-500">{data.repo.owner}/{data.repo.name}@{data.repo.branch}</p>

		<div class="mt-4">
			<FileTree tree={data.tree} selectedPath={data.selectedPath} repoTag={data.repo.tag} />
		</div>
	</aside>

	<div class="flex h-[80vh] flex-col gap-3">
		<section class="min-h-0 flex-1 overflow-hidden rounded border border-border bg-slate-900 p-2">
			{#if data.selectedPath}
				<div class="mb-2 border-b border-slate-700 pb-2 font-mono text-xs text-slate-300">{data.selectedPath}</div>
				<ReadonlyCode filePath={data.selectedPath} content={data.selectedContent} />
			{:else}
				<div class="flex h-full items-center justify-center text-sm text-slate-400">
					Select a file in the left panel to inspect it.
				</div>
			{/if}
		</section>

		{#if data.selectedPath}
			<section class="shrink-0 rounded border border-border bg-white p-3">
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
					<label for="note-content" class="mb-1 block text-xs font-medium text-slate-500">Notes for this file</label>
					<Textarea
						id="note-content"
						name="content"
						rows={3}
						placeholder="Add your notes for this file..."
						value={data.noteContent}
						class="mb-2 resize-y"
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
</div>
