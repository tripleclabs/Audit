<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import { Sun, Moon } from '@lucide/svelte';
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

	let { data }: { data: PageData } = $props();
	let saving = $state(false);
	let saved = $state(false);
	let darkTheme = $state(false);
	let formEl: HTMLFormElement | undefined = $state();

	const pathSegments = $derived(data.selectedPath ? data.selectedPath.split('/') : []);
	const basePath = $derived(`/projects/${data.project.slug}/${data.repo.name}`);
	const watermarkEmail = $derived(data.user?.email ?? '');

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
		</SidebarHeader>
		<SidebarContent>
			<SidebarGroup>
				<SidebarGroupLabel>Files</SidebarGroupLabel>
				<SidebarGroupContent>
					<FileTree tree={data.tree} selectedPath={data.selectedPath} basePath={basePath} />
				</SidebarGroupContent>
			</SidebarGroup>
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

		<div class="flex flex-1 flex-col overflow-hidden">
			<section class="relative flex-1 overflow-hidden p-2 {darkTheme ? 'bg-slate-900' : 'bg-gray-50'}">
				{#if data.selectedPath}
					<ReadonlyCode filePath={data.selectedPath} content={data.selectedContent} dark={darkTheme} />
				{:else}
					<div class="flex h-full items-center justify-center text-sm {darkTheme ? 'text-slate-400' : 'text-slate-500'}">
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
				<section class="shrink-0 border-t border-border bg-white p-3">
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
	</SidebarInset>
</SidebarProvider>
