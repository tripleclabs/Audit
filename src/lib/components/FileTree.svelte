<script lang="ts" module>
	type TreeNode = { path: string; type: string };
	type DirEntry = { name: string; fullPath: string; children: DirEntry[]; isFile: boolean };

	function buildTree(nodes: TreeNode[]): DirEntry[] {
		const root: DirEntry = { name: '', fullPath: '', children: [], isFile: false };

		for (const node of nodes) {
			if (node.type !== 'blob') continue;
			const parts = node.path.split('/');
			let current = root;
			for (let i = 0; i < parts.length; i++) {
				const part = parts[i];
				const isFile = i === parts.length - 1;
				let child = current.children.find((c) => c.name === part);
				if (!child) {
					child = {
						name: part,
						fullPath: isFile ? node.path : parts.slice(0, i + 1).join('/'),
						children: [],
						isFile
					};
					current.children.push(child);
				}
				current = child;
			}
		}

		// Sort: folders first, then alphabetical
		function sortEntries(entries: DirEntry[]) {
			entries.sort((a, b) => {
				if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
				return a.name.localeCompare(b.name);
			});
			for (const entry of entries) {
				if (!entry.isFile) sortEntries(entry.children);
			}
		}
		sortEntries(root.children);
		return root.children;
	}
</script>

<script lang="ts">
	let { tree, selectedPath, repoTag }: { tree: TreeNode[]; selectedPath: string; repoTag: string } =
		$props();

	const entries = $derived(buildTree(tree));

	// Track which folders are expanded
	let expanded = $state<Record<string, boolean>>({});

	// Auto-expand folders containing the selected path
	$effect(() => {
		if (selectedPath) {
			const parts = selectedPath.split('/');
			for (let i = 1; i < parts.length; i++) {
				expanded[parts.slice(0, i).join('/')] = true;
			}
		}
	});

	function toggle(path: string) {
		expanded[path] = !expanded[path];
	}
</script>

{#snippet entryList(items: DirEntry[], depth: number)}
	{#each items as entry}
		{#if entry.isFile}
			<a
				href={`/repos/${repoTag}?path=${encodeURIComponent(entry.fullPath)}`}
				class={`flex items-center gap-1.5 truncate rounded px-2 py-0.5 text-sm hover:bg-slate-200 ${selectedPath === entry.fullPath ? 'bg-slate-200 font-medium' : ''}`}
				style="padding-left: {depth * 16 + 8}px"
				title={entry.fullPath}
			>
				<svg class="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
					<polyline points="14 2 14 8 20 8" />
				</svg>
				{entry.name}
			</a>
		{:else}
			<button
				onclick={() => toggle(entry.fullPath)}
				class="flex w-full items-center gap-1.5 truncate rounded px-2 py-0.5 text-sm hover:bg-slate-200 cursor-pointer"
				style="padding-left: {depth * 16 + 8}px"
			>
				<svg
					class="h-4 w-4 shrink-0 text-slate-500 transition-transform {expanded[entry.fullPath] ? 'rotate-90' : ''}"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<polyline points="9 18 15 12 9 6" />
				</svg>
				<svg class="h-4 w-4 shrink-0 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
				</svg>
				{entry.name}
			</button>
			{#if expanded[entry.fullPath]}
				{@render entryList(entry.children, depth + 1)}
			{/if}
		{/if}
	{/each}
{/snippet}

{@render entryList(entries, 0)}
