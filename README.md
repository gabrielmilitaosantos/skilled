# Skilled

A registry for AI agent skills — discover, publish, and manage reusable capabilities from a route-driven workspace.

**Live application:** [skilled-iota.vercel.app](https://skilled-iota.vercel.app)

---

## Overview

Skilled is a platform where authenticated users can publish "skills" — reusable AI agent behavior definitions, including an install command, prompt configuration, and usage example. Other users can explore the catalog, search by name, tag or author, upvote, and save skills of interest.

## Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start (React 19, SSR) |
| Routing | TanStack Router (file-based) |
| Server state | TanStack Query |
| Database | PostgreSQL (Neon, serverless) |
| ORM | Drizzle ORM |
| Authentication | Clerk |
| Styling | Tailwind CSS v4 |
| Validation | Zod |
| Analytics | Umami |
| Build / Deploy | Vite + Nitro → Vercel |
| Lint / Format | Biome |

## Architecture

### Routing and rendering

The project uses TanStack Router's file-based routing. Routes that require data on load use a `loader` to fetch server-side before the first render (SSR). Pages with reactive search and filters (`/skills`) combine this initial `loader` with TanStack Query on the client, which takes over refetching, debouncing, and pagination without full reloads.

### Server layer

All database communication goes through **server functions** (`createServerFn`), organized as:

```
src/server/
  skills/
    queries/      → reads (getSkills, searchSkills, getSkillById, ...)
    mutations/    → writes (createSkill, toggleVote, toggleSave, ...)
    schemas/      → shared Zod validation between client and server
  users/
    queries/
    mutations/
```

This pattern prevents server-only code (database connections, secrets) from leaking into the client bundle — TanStack Start creates an RPC bridge between the component call and the actual server-side execution.

### Authentication and user sync

Authentication is handled by **Clerk**, supporting email/password and OAuth (Google). Since the application database maintains its own `users` table — decoupled from Clerk by design, using `clerkId` only as a reference key — synchronization between both sources happens via **webhook**:

```
Clerk (user.created / user.updated / user.deleted)
  → POST /api/webhooks/clerk
  → syncUser() / deleteUser()
  → users table in Postgres
```

Protected routes (`/skills/new`, `/saved`) verify the session in the root route's `beforeLoad`, which populates `userId` in the router context from a server-side Clerk call — available to any child route without repeated requests.

### Data model

```
users (id, clerk_id, email, username, image_url)
  ↓ 1:N
skills (id, author_id, title, description, tags[], install_command, prompt_config, usage_example, created_at)
  ↓ N:N (via junction tables with composite primary key)
skill_votes (user_id, skill_id)
saved_skills (user_id, skill_id)
```

Indexes on `author_id`, `created_at`, and a GIN index on `tags` support the most frequent queries (listing by author, chronological ordering, and tag search).

### Error handling

Domain errors (`NotFoundError`, `UnauthorizedError`, `DatabaseError`) are typed classes with `serializationAdapters` registered in `start.ts`, ensuring the class identity survives the server → client boundary in loaders. For mutations called directly from the client (votes, saves), the same errors are identified by `name` as a fallback strategy, since that TanStack Start serialization path does not preserve `instanceof` the same way. An `errorComponent` at the root route level catches any unhandled error and renders an appropriate page by type (404, 401, database failure, generic error).

### Theming

Dark mode is the default. The preference is persisted in `localStorage` and applied via a synchronous inline script in `<head>`, before the first paint — preventing theme flash on load.

## Environments

| | Development | Production |
|---|---|---|
| Hosting | `localhost:3000` (Vite dev server) | Vercel |
| Database | Neon (single branch) | Neon (same project) |
| Authentication | Clerk — development instance | Clerk — development instance |
| Clerk webhook | Tunnel via Cloudflare (`cloudflared`) | `https://skilled-iota.vercel.app/api/webhooks/clerk` |
| Analytics | Disabled | Umami Cloud |

> The project runs entirely on services with a permanent free tier (Vercel, Neon, Clerk, Umami Cloud), with no dependency on credit cards or expiring credits.

## Local setup

### Prerequisites

- Node.js 20+
- [Neon](https://neon.tech) account (serverless PostgreSQL)
- [Clerk](https://clerk.com) account
- [Umami Cloud](https://cloud.umami.is) account (optional, for analytics)

### 1. Clone and install

```bash
git clone https://github.com/<your-username>/skilled.git
cd skilled
npm install
```

### 2. Environment variables

Create a `.env.local` file at the project root:

```env
# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxx
CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx
CLERK_WEBHOOK_SIGNING_SECRET=whsec_xxxxxxxxxxxxxxxx

# Neon PostgreSQL
DATABASE_URL=postgresql://user:password@host.neon.tech/skilled?sslmode=require
```

### 3. Database

Generate and apply migrations to the configured database:

```bash
npm run db:generate
npm run db:migrate
```

### 4. Clerk webhook (development)

User synchronization requires Clerk to reach your local environment. Use a tunnel:

```bash
npx cloudflared tunnel --url http://localhost:3000
```

Configure the generated URL (`https://xxxx.trycloudflare.com/api/webhooks/clerk`) as a webhook endpoint in the Clerk Dashboard, subscribing to the `user.created` event (and other user events as needed).

### 5. Run the project

```bash
npm run dev
```

The application starts at `http://localhost:3000`.

### Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the development server |
| `npm run build` | Production build (Vite + Nitro) |
| `npm start` | Runs the production build locally |
| `npm run db:generate` | Generates migrations from the schema |
| `npm run db:migrate` | Applies pending migrations to the database |
| `npm run lint` / `format` / `check` | Lint, formatting, and checking via Biome |
| `npm test` | Runs the test suite |

## Deployment

Deployment is done on Vercel via GitHub integration — any push to the main branch automatically triggers a new build. The build uses the `nitro/vite` plugin, which Vercel detects and packages without additional manual configuration.

Production environment variables are configured directly in the Vercel dashboard (Project → Settings → Environment Variables), mirroring the same keys from `.env.local`.