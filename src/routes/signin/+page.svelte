<script lang="ts">
  import { enhance } from '$app/forms';
  let { form } = $props();
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
  <div class="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow">
    <div class="text-center">
      <h1 class="text-2xl font-semibold text-gray-900">Sign in to Audit</h1>
      <p class="mt-2 text-sm text-gray-500">Choose a provider to continue</p>
    </div>

    <form method="post" action="?/signInSocial" use:enhance class="space-y-4">
      <input type="hidden" name="provider" value="github" />
      <input type="hidden" name="callbackURL" value="/" />

      <button
        type="submit"
        class="w-full inline-flex items-center justify-center gap-2 rounded-md bg-black text-white px-4 py-2 text-sm font-medium hover:opacity-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.85 10.91.57.1.78-.25.78-.56 0-.28-.01-1.02-.02-2-3.19.69-3.86-1.54-3.86-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.74 2.68 1.24 3.33.95.1-.74.4-1.24.73-1.53-2.55-.29-5.23-1.28-5.23-5.71 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.14 1.18a10.9 10.9 0 0 1 2.86-.39c.97 0 1.95.13 2.86.39 2.17-1.49 3.13-1.18 3.13-1.18.63 1.59.24 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.44-2.68 5.41-5.24 5.69.41.35.77 1.04.77 2.1 0 1.52-.01 2.74-.01 3.11 0 .31.2.66.79.55C20.71 21.39 24 17.09 24 12 24 5.65 18.35.5 12 .5z"/>
        </svg>
        Sign in with GitHub
      </button>
    </form>

    <p class="text-center text-sm text-gray-500">Or contact your administrator for access.</p>
  </div>
</div>
