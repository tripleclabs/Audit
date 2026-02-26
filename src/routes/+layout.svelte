<script lang="ts">
	import '../app.css';
	import type { LayoutData } from './$types';

	export let data: LayoutData;
</script>

<main class="mx-auto flex min-h-screen w-full max-w-7xl px-4 py-8">
	<slot />
</main>
