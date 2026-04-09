# Copilot Instructions

## Next.js DevTools (MCP) — REQUIRED

When working on anything Next.js-related in this repo (routing, data fetching, caching, config, deployment, errors):

1. **Start the session by calling the Next.js init tool**

- Tool: `mcp_io_github_ver_init` (project path: repo root)

2. **Documentation-first, always**

- Use `mcp_io_github_ver_nextjs_docs` for _every_ Next.js concept/API.
- Prefer `action: "get"` with a known docs `path`.
- If you don’t know the path, use `action: "search"` to find it.

3. **Runtime-first debugging for this app**

- Use `mcp_io_github_ver_nextjs_index` to discover running dev servers and available MCP tools.
- Use `mcp_io_github_ver_nextjs_call` to pull real runtime errors/routes/diagnostics before changing code.

4. **Verification**

- When changes affect client behavior or rendering, verify via `mcp_io_github_ver_browser_eval` (real browser).

## Chrome DevTools MCP — Testing/Inspection

When you need **browser-level** verification (console errors, network payloads, DOM state, dialogs), use the Chrome DevTools MCP tools:

- **Evaluate JS in the page**: `mcp_io_github_chr_evaluate_script`
- **Inspect network requests/responses**: `mcp_io_github_chr_get_network_request`
- **Handle browser dialogs**: `mcp_io_github_chr_handle_dialog`
- **Select an existing page/tab context**: `mcp_io_github_chr_select_page`

Use this alongside Next.js MCP (`nextjs_index`/`nextjs_call`) and `browser_eval` when a bug only reproduces in a real browser.

## Context7 — Up-to-date library info

When you need up-to-date documentation for **non-Next.js** libraries (e.g., Prisma, Spotify SDKs, auth libs), use Context7:

1. Resolve the library ID: `mcp_io_github_ups_resolve-library-id`
2. Fetch docs/snippets: `mcp_io_github_ups_get-library-docs`

Note: For Next.js itself, prefer `mcp_io_github_ver_nextjs_docs` (official Next.js docs via MCP) as the first source of truth.

## Project commands & tooling (from package.json)

- Package manager: npm (repo includes `package-lock.json`)
- Dev server: `npm run dev` (runs `next dev --turbopack`)
- Production build: `npm run build` (runs `next build`)
- Start prod server: `npm run start` (runs `next start`)
- Lint: `npm run lint` (runs `eslint .`; `next lint` is not used)
- Tests: `npm run test` (runs `jest`)
- Postbuild: `npm run postbuild` uploads LaunchDarkly sourcemaps using `@launchdarkly/ldcli`

### Key runtime deps

- Framework: `next@15.5.9`, `react@19.2.0`, `react-dom@19.2.0`
- Data/cache/state: `@tanstack/react-query@5.66`, `zustand`
- Tailwind: `tailwindcss@^4` (+ `@tailwindcss/postcss`, `tailwindcss-animate`, `tailwind-scrollbar`)

## Repo notes

- This is a Next.js App Router codebase (see the `app/` directory).
