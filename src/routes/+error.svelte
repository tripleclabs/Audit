<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="flex min-h-screen items-center justify-center">
	<div class="text-center">
		<p class="text-6xl font-semibold text-muted-foreground">{page.status}</p>
		<p class="mt-4 text-lg">{page.error?.message ?? 'Something went wrong'}</p>
		<a href="/" class="mt-6 inline-block text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
			Go home
		</a>
	</div>
</div>
