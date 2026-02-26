<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<main class="mx-auto flex min-h-screen w-full max-w-7xl px-4 py-8">
	{@render children()}
</main>
