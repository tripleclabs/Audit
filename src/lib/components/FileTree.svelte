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
	import {
		SidebarMenu,
		SidebarMenuItem,
		SidebarMenuButton,
		SidebarMenuSub,
		SidebarMenuSubItem,
		SidebarMenuSubButton
	} from '$lib/components/ui/sidebar';

	let { tree, selectedPath, repoTag }: { tree: TreeNode[]; selectedPath: string; repoTag: string } =
		$props();

	const entries = $derived(buildTree(tree));

	let expanded = $state<Record<string, boolean>>({});

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

{#snippet fileIcon()}
	<svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
		<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
		<polyline points="14 2 14 8 20 8" />
	</svg>
{/snippet}

{#snippet folderIcon(open: boolean)}
	<svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
		{#if open}
			<path d="M5 19a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4l2 3h9a2 2 0 0 1 2 2v1M5 19h14a2 2 0 0 0 2-2l1-9H4l1 9z" />
		{:else}
			<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
		{/if}
	</svg>
{/snippet}

{#snippet chevron(open: boolean)}
	<svg class="h-3 w-3 shrink-0 transition-transform {open ? 'rotate-90' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
		<polyline points="9 18 15 12 9 6" />
	</svg>
{/snippet}

{#snippet renderEntries(items: DirEntry[], isRoot: boolean)}
	{#each items as entry}
		{#if entry.isFile}
			{#if isRoot}
				<SidebarMenuItem>
					<SidebarMenuButton isActive={selectedPath === entry.fullPath}>
						{@render fileIcon()}
						<a href={`/repos/${repoTag}?path=${encodeURIComponent(entry.fullPath)}`} title={entry.fullPath}>
							<span>{entry.name}</span>
						</a>
					</SidebarMenuButton>
				</SidebarMenuItem>
			{:else}
				<SidebarMenuSubItem>
					<SidebarMenuSubButton size="sm" isActive={selectedPath === entry.fullPath}>
						<a href={`/repos/${repoTag}?path=${encodeURIComponent(entry.fullPath)}`} title={entry.fullPath}>
							<span>{entry.name}</span>
						</a>
					</SidebarMenuSubButton>
				</SidebarMenuSubItem>
			{/if}
		{:else}
			{#if isRoot}
				<SidebarMenuItem>
					<SidebarMenuButton onclick={() => toggle(entry.fullPath)}>
						{@render chevron(!!expanded[entry.fullPath])}
						{@render folderIcon(!!expanded[entry.fullPath])}
						<span>{entry.name}</span>
					</SidebarMenuButton>
					{#if expanded[entry.fullPath]}
						<SidebarMenuSub>
							{@render renderEntries(entry.children, false)}
						</SidebarMenuSub>
					{/if}
				</SidebarMenuItem>
			{:else}
				<SidebarMenuSubItem>
					<SidebarMenuSubButton size="sm" onclick={() => toggle(entry.fullPath)}>
						{@render chevron(!!expanded[entry.fullPath])}
						<span>{entry.name}</span>
					</SidebarMenuSubButton>
					{#if expanded[entry.fullPath]}
						<SidebarMenuSub>
							{@render renderEntries(entry.children, false)}
						</SidebarMenuSub>
					{/if}
				</SidebarMenuSubItem>
			{/if}
		{/if}
	{/each}
{/snippet}

<SidebarMenu>
	{@render renderEntries(entries, true)}
</SidebarMenu>
