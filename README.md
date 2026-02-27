# Audit

A SvelteKit application for **read-only repository auditing**.

## What it does

- Authenticates users via GitHub OAuth.
- Restricts access to a whitelist of GitHub usernames from `config/users.json`.
- Shows only configured repositories from `config/repos.json` (each with a tag).
- Renders a left-side file list and a read-only CodeMirror viewer for file contents.
- Reads repository contents through the GitHub API with short-lived in-memory caching.

## Configuration

### Audit log (new)

Every time a repository file is viewed the server writes a row to the `audit` table
with the user identifier (email, then name, then user id), client IP, repository tag,
file path and timestamp.  The schema is managed by `drizzle-kit`; after pulling the
latest changes run:

```bash
npm run db:push   # or bun run db:push
```

You can inspect the table using `npm run db:studio` or query it directly from
Postgres.  For example:

```sql
SELECT user, ip, repo, file_path, accessed_at
FROM audit
ORDER BY accessed_at DESC
LIMIT 50;
```


## Configuration

### 1) Allowed users

Edit `config/users.json`:

```json
[
  "octocat",
  "your-github-username"
]
```

### 2) Repositories

Edit `config/repos.json`:

```json
[
  {
    "tag": "kit",
    "owner": "sveltejs",
    "name": "kit",
    "branch": "main"
  }
]
```

Note: yes—SvelteKit is in the `sveltejs/kit` GitHub repository, so `owner: "sveltejs"` and `name: "kit"` is the correct mapping when you want to audit SvelteKit itself.

## Environment variables

Create a `.env` file:

```bash
AUTH_SECRET=replace-with-random-secret
GITHUB_ID=github-oauth-client-id
GITHUB_SECRET=github-oauth-client-secret
GITHUB_API_TOKEN=optional-personal-access-token
```

`GITHUB_API_TOKEN` is optional but recommended to reduce anonymous API rate-limit pressure.

## Quick start

```bash
npm install
npm run dev
```

## GitHub OAuth setup

Create a GitHub OAuth app and set:

- **Homepage URL**: `http://localhost:5173`
- **Authorization callback URL**: `http://localhost:5173/auth/callback/github`
