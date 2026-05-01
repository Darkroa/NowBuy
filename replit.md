# NowBuy Workspace

## Overview

NowBuy is an AI-powered e-commerce storefront with a shopping concierge assistant. It uses a pnpm monorepo with TypeScript.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS v4
- **Routing**: Wouter
- **AI**: OpenAI via Replit AI Integrations (chat assistant)
- **Auth**: Custom cookie-based auth (bcryptjs)
- **Object Storage**: Google Cloud Storage (Replit sidecar)

## Artifacts

- **storefront** (`/`) — Main NowBuy storefront (React + Vite)
- **api-server** (`/api`) — Express backend API
- **mockup-sandbox** (`/__mockup`) — Design mockup sandbox

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Libraries

- `@workspace/db` — PostgreSQL + Drizzle schema (users, products, orders, cart, chat, password-reset)
- `@workspace/api-zod` — Zod validation schemas (generated from OpenAPI spec)
- `@workspace/api-client-react` — React Query hooks (generated from OpenAPI spec)
- `@workspace/integrations-openai-ai-server` — Server-side OpenAI SDK client
- `@workspace/integrations-openai-ai-react` — React hooks for voice/audio

## User Roles

- `buyer` — Regular customers
- `admin` — Full admin access (users, orders, catalog, password management)
- `pm` — Product manager (orders + catalog only)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
