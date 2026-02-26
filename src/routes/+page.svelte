<script lang="ts">
	import { Github } from '@lucide/svelte';
	import { Button } from '$components/ui/button';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<section class="w-full rounded-lg border border-border p-8 shadow-sm">
	<h1 class="text-2xl font-semibold">Audit</h1>
	<p class="mt-2 text-sm text-slate-600">SvelteKit + shadcn-svelte + GitHub authentication starter.</p>

	{#if data.session?.user}
		<div class="mt-6 space-y-2">
			<p class="text-sm">Signed in as <span class="font-medium">{data.session.user.email ?? data.session.user.name}</span>.</p>
			<form method="POST" action="?/signout">
				<Button variant="secondary" type="submit">Sign out</Button>
			</form>
		</div>
	{:else}
		<form class="mt-6" method="POST" action="?/signin">
			<Button type="submit" class="gap-2">
				<Github class="h-4 w-4" />
				Continue with GitHub
			</Button>
		</form>
	{/if}
</section>
