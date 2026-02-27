<script lang="ts">
	import { Github } from '@lucide/svelte';
	import { Button } from '$components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Separator } from '$lib/components/ui/separator';
	import { authClient } from '$lib/auth-client';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let email = $state('');
	let magicLinkSent = $state(false);
	let magicLinkError = $state('');
	let magicLinkLoading = $state(false);

	async function sendMagicLink() {
		if (!email) return;
		magicLinkLoading = true;
		magicLinkError = '';
		const { error } = await authClient.signIn.magicLink({ email, callbackURL: '/' });
		magicLinkLoading = false;
		if (error) {
			magicLinkError = error.message ?? 'Failed to send magic link';
		} else {
			magicLinkSent = true;
		}
	}
</script>

<main class="mx-auto min-h-screen w-full max-w-5xl px-4 py-12">
	{#if data.session?.user}
		<div class="mb-8 flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-semibold tracking-tight">Audit Portal</h1>
				<p class="mt-1 text-sm text-muted-foreground">
					Signed in as <span class="font-medium text-foreground">{data.session.user.email ?? data.session.user.name}</span>
				</p>
			</div>
			<form method="POST" action="?/signout">
				<Button variant="outline" size="sm" type="submit">Sign out</Button>
			</form>
		</div>

		<Separator class="mb-8" />

		<h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Projects</h2>

		{#if data.projects.length === 0}
			<p class="text-sm text-muted-foreground">No projects assigned. Contact your administrator.</p>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.projects as project}
					{@const totalNotes = project.repos.reduce((sum, r) => sum + (data.noteCounts[`${project.slug}/${r.owner}/${r.name}`] ?? 0), 0)}
					<a href={`/projects/${project.slug}`} class="group">
						<Card class="transition-shadow hover:shadow-md">
							<CardHeader class="pb-2">
								<div class="flex items-center justify-between">
									<CardTitle class="text-base">{project.name}</CardTitle>
									{#if totalNotes > 0}
										<Badge variant="secondary">{totalNotes} {totalNotes === 1 ? 'note' : 'notes'}</Badge>
									{/if}
								</div>
								<CardDescription class="text-xs">
									{project.repos.length} {project.repos.length === 1 ? 'repository' : 'repositories'}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div class="flex flex-wrap gap-1.5">
									{#each project.repos as repo}
										<span class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
											{repo.owner}/{repo.name}
										</span>
									{/each}
								</div>
							</CardContent>
						</Card>
					</a>
				{/each}
			</div>
		{/if}
	{:else}
		<div class="flex min-h-[60vh] items-center justify-center">
			<Card class="w-full max-w-sm">
				<CardHeader class="text-center">
					<CardTitle class="text-xl">Audit Portal</CardTitle>
					<CardDescription>Read-only source access for approved auditors.</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					{#if magicLinkSent}
						<div class="rounded-md bg-green-50 p-3 text-center">
							<p class="text-sm font-medium text-green-800">Check your email</p>
							<p class="mt-1 text-xs text-green-600">We sent a sign-in link to {email}</p>
						</div>
						<Button variant="ghost" size="sm" class="w-full" onclick={() => { magicLinkSent = false; email = ''; }}>
							Try a different email
						</Button>
					{:else}
						<form onsubmit={(e) => { e.preventDefault(); sendMagicLink(); }} class="space-y-2">
							<Input type="email" placeholder="you@example.com" bind:value={email} required />
							<Button type="submit" class="w-full" disabled={magicLinkLoading}>
								{magicLinkLoading ? 'Sending...' : 'Sign in with email'}
							</Button>
							{#if magicLinkError}
								<p class="text-xs text-red-600">{magicLinkError}</p>
							{/if}
						</form>

						<div class="relative">
							<div class="absolute inset-0 flex items-center">
								<Separator />
							</div>
							<div class="relative flex justify-center text-xs uppercase">
								<span class="bg-card px-2 text-muted-foreground">or</span>
							</div>
						</div>

						<form method="POST" action="?/signin">
							<Button type="submit" variant="outline" class="w-full gap-2">
								<Github class="h-4 w-4" />
								Continue with GitHub
							</Button>
						</form>
					{/if}
				</CardContent>
				<CardFooter class="justify-center">
					<p class="text-xs text-muted-foreground">Contact your administrator for access.</p>
				</CardFooter>
			</Card>
		</div>
	{/if}
</main>
