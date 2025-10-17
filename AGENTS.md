# AGENTS.md

## Project Overview

Assistant web app to review Buildoers blog posts against Buido's guidelines and checklist.

## Technology Stack

- **React Router v7**: File-based routing with loaders and actions
- **TypeScript**: Strict mode enabled
- **Vite**: Fast development server and build tool
- **pnpm**: Package manager
- **Valibot**: Lightweight schema validation
- **shadcn/ui**: Component library with Tailwind CSS
- **Tailwind CSS v4**: Utility-first styling

## Setup Commands

- Install dependencies: `pnpm install`
- Start dev server: `pnpm dev`
- Build for production: `pnpm build`
- Start production server: `pnpm start`
- Type checking: `pnpm typecheck`
- Format code: `pnpm format`
- Check formatting: `pnpm check`

## Project Structure

```
app/
├── lib/              # Utility functions and helpers
├── model/            # TypeScript types and interfaces
├── routes/           # Route components (file-based routing)
├── service/          # API calls and business logic
├── app.css           # Global styles
├── root.tsx          # Root layout component
└── routes.ts         # Route configuration
```

## Code Style Guidelines

- **Components**: Use full function declarations with explicit typing
  ```tsx
  export default function ComponentName(): JSX.Element {
    // component logic
  }
  ```
- **Functional style**: Prefer derived state and pure functions
- **Variables**: Use `const` by default, avoid `let` when possible
- **Types**: Always provide explicit types for function parameters and return values
- **TypeScript**: Strict mode is enabled - no implicit any
- **Imports**: Use path alias `~/*` for app directory imports

## React Router v7 Patterns

- Routes are defined in `app/routes.ts` using the file-based routing system
- Use `Route.LoaderArgs` and `Route.ActionArgs` for type-safe data loading
- Export `meta`, `links`, `loader`, and `action` functions as needed
- Use `Route.MetaArgs` for meta tags
- Access route data with type-safe imports from `./+types/[route]`

## Valibot Usage

- Import validation functions: `import * as v from 'valibot'`
- Use `v.pipe()` for composing validators
- Derive types: `type FormData = v.InferOutput<typeof FormSchema>`
- Use `v.parse()` for validation that throws or `v.safeParse()` for error handling

## Path Aliases

- `~/*` maps to `./app/*`
- Configured in `tsconfig.json` and `vite.config.ts`

## UI Components

- Uses shadcn/ui component library
- Add new components: `pnpm dlx shadcn@latest add <component>`
- Components use Tailwind CSS for styling
- Configuration in `components.json`

## Development Workflow

- Make changes to route files in `app/routes/`
- TypeScript strict mode will catch type errors
- Vite HMR provides instant feedback
- Before committing, run `pnpm typecheck` to ensure no type errors

## Environment

- Node.js 20+ required (see Dockerfile)
- Uses ESM modules throughout
- Server-side rendering (SSR) enabled by default in `react-router.config.ts`
