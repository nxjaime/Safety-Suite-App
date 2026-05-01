# React + TypeScript + Vite

## MCP Setup (Supabase + Vercel)

Project MCP servers are configured in `.mcp.json`.

### Prerequisites

- `node`, `npm`, `npx` installed
- MCP-enabled CLI available in your environment

### Required environment variables

```sh
export SUPABASE_ACCESS_TOKEN="***"
export VERCEL_TOKEN="***"
```

### Verify MCP connectivity

Use your configured MCP client to verify the Supabase and Vercel servers are available.

If `npx` is not on your path in this environment:

```sh
export PATH="$HOME/.local/node/bin:$PATH"
```

## Sprint Close Script

Run this at the end of a sprint to auto-stage, run checks, commit, and push:

```sh
./scripts/sprint-close.sh
```

Behavior:
- Stages all changes
- Runs `npm run build` and `npm run test -- --run src/test`
- Commits with `sprint-<n>: closeout` (parsed from `handoff.md`)
- Pushes to the current branch

## Demo Data Seed

Populate realistic sample data across drivers, safety, coaching/tasks, inspections/compliance, documents, fleet operations, and training:

```sh
npm run seed:demo
```

Target a specific organization:

```sh
npm run seed:demo -- --org-id <organization-uuid>
```

Notes:
- `seed:demo` requires `SUPABASE_SERVICE_ROLE_KEY`; anon keys will fail under RLS.
- You can set `DEMO_ORG_ID=<organization-uuid>` as an alternative to `--org-id`.
- The script is idempotent for the seeded records and safe to rerun.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
 globalIgnores(['dist']),
 {
   files: ['**/*.{ts,tsx}'],
   extends: [
     // Other configs...

     // Remove tseslint.configs.recommended and replace with this
     tseslint.configs.recommendedTypeChecked,
     // Alternatively, use this for stricter rules
     tseslint.configs.strictTypeChecked,
     // Optionally, add this for stylistic rules
     tseslint.configs.stylisticTypeChecked,

     // Other configs...
   ],
   languageOptions: {
     parserOptions: {
       project: ['./tsconfig.node.json', './tsconfig.app.json'],
       tsconfigRootDir: import.meta.dirname,
     },
     // other options...
   },
 },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
 globalIgnores(['dist']),
 {
   files: ['**/*.{ts,tsx}'],
   extends: [
     // Other configs...
     // Enable lint rules for React
     reactX.configs['recommended-typescript'],
     // Enable lint rules for React DOM
     reactDom.configs.recommended,
   ],
   languageOptions: {
     parserOptions: {
       project: ['./tsconfig.node.json', './tsconfig.app.json'],
       tsconfigRootDir: import.meta.dirname,
     },
     // other options...
   },
 },
])
```
