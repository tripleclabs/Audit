# audit

SvelteKit starter configured with:

- **shadcn-svelte** conventions (Tailwind + component structure)
- **Auth.js for SvelteKit** with GitHub login support

## Quick start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy and fill in environment variables:

   ```bash
   cp .env.example .env
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

## GitHub OAuth setup

Create a GitHub OAuth app and set:

- **Homepage URL**: `http://localhost:5173`
- **Authorization callback URL**: `http://localhost:5173/auth/callback/github`

Then update `.env` with `GITHUB_ID`, `GITHUB_SECRET`, and `AUTH_SECRET`.
