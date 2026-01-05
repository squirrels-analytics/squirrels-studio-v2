# AGENTS.md - Development Guidelines for AI Assistants

This document provides guidance for AI agents working on the Squirrels Studio v2 codebase.

## Project Overview

**Squirrels Studio v2** is a React-based analytics and data exploration tool that connects to a Squirrels API server, and is especially useful for testing and exploring a Squirrels project. It allows users to:
- Connect to an API server (host URL and mounted path configuration)
- Authenticate (login or guest access)
- Explore datasets and dashboards with parameterized queries
- View and interact with data tables

## Tech Stack

- **Framework**: React 19.2.0 with TypeScript
- **Build Tool**: Vite (using rolldown-vite)
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS v4
- **Theme**: next-themes for dark/light mode
- **Icons**: lucide-react

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (button, dropdown-menu)
│   ├── mode-toggle.tsx # Theme toggle component
│   └── theme-provider.tsx # Theme context provider
├── pages/              # Page components
│   ├── ConnectPage.tsx # Initial connection page
│   ├── LoginPage.tsx   # Authentication page
│   └── ExplorerPage.tsx # Data exploration interface
├── lib/                # Utility functions
│   └── utils.ts        # Common utilities
├── App.tsx             # Main app component with routing
└── main.tsx            # Entry point
```

## Critical Development Guidelines

### ⚠️ Avoid `useEffect` Unless Absolutely Necessary

**IMPORTANT**: This project follows a pattern of avoiding `useEffect` hooks unless there is no alternative. Most side effects can be handled through:

1. **Event handlers** - User interactions, form submissions
2. **SWR hooks** - For data fetching (see below)
3. **React Router hooks** - For navigation and URL-based state
4. **Component composition** - Passing callbacks and state through props

**When `useEffect` IS acceptable:**
- Setting up subscriptions that require cleanup (e.g., WebSocket connections)
- Integrating with third-party libraries that require imperative APIs
- Synchronizing with browser APIs that don't have React-friendly alternatives

**When `useEffect` should be AVOIDED:**
- Data fetching (use SWR instead)
- Updating state based on props (use derived state or callbacks)
- Side effects triggered by user actions (use event handlers)
- Initialization logic (use component initialization or SWR)

### Routing

The app uses **HashRouter** (for GitHub Pages compatibility):
- `/` - ConnectPage (initial connection)
- `/login` - LoginPage (authentication)
- `/explorer` - ExplorerPage (data exploration)

**Navigation:**
```typescript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/explorer');
```

### API Routes

See the `/src/types/ProjectMetadataResponse.ts` file for the API routes. For instance, the "get_data_catalog_url" is documented in the `/src/types/ProjectMetadataResponse.ts` file.

To find documentation on the API routes, see the files in the `/openapi_docs` directory. For instance, the "get_data_catalog_url" is documented in the `/openapi_docs/paths/api_0_data-catalog.md` file.

The API routes returned by the backend are full URLs, so you should use them directly instead of joining them with the host URL.

### Styling Guidelines

- Use **Tailwind CSS** utility classes
- Follow the existing design system (card, border, background, foreground colors)
- Use semantic color tokens: `bg-background`, `text-foreground`, `border-border`, etc.
- Dark mode is supported via `next-themes`

### Component Patterns

1. **Functional Components**: All components are functional components using hooks
2. **TypeScript**: Strict typing is enforced - always type props and state
3. **Component Composition**: Break down complex components into smaller, reusable pieces
4. **Props Interface**: Define clear prop types/interfaces

**Example:**
```typescript
interface ComponentProps {
  title: string;
  onAction: (value: string) => void;
}

const Component: React.FC<ComponentProps> = ({ title, onAction }) => {
  // Component implementation
};
```

### Development Workflow

1. **Run dev server**: `pnpm dev`
2. **Build**: `pnpm build`
3. **Lint**: `pnpm lint`

### Common Patterns to Follow

1. **Form Handling**: Use controlled components with `useState` and form `onSubmit`
2. **Loading States**: Use SWR's built-in `isLoading` or `isMutating` states
3. **Error Handling**: Use SWR's `error` state and display user-friendly messages
4. **Theme Toggle**: Use the existing `ModeToggle` component
5. **Navigation**: Use React Router's `useNavigate` hook

### Things to Avoid

1. ❌ Don't use `useEffect` for data fetching
2. ❌ Don't use `fetch` directly in components (use SWR)
3. ❌ Don't hardcode API URLs
4. ❌ Don't create unnecessary wrapper components
5. ❌ Don't mix inline styles with Tailwind (use Tailwind classes)
6. ❌ Don't write duplicate code
7. ❌ Do not use session storage or local storage for storing data

## Questions?

If you're unsure about an approach:
1. Check existing code patterns in the codebase
2. Prefer simpler solutions over complex ones
3. Follow React best practices and the guidelines above
4. When in doubt, use SWR for data fetching and avoid useEffect
