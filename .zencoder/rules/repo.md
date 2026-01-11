---
description: Repository Information Overview
alwaysApply: true
---

# Temple Finder Pro Information

## Summary
A modern web application for finding and booking temples, featuring a vendor dashboard, customer reviews, and a social feed. Built with React, TypeScript, and Vite, it utilizes Supabase for its backend, database, and edge functions.

## Structure
- **src/**: Main application source code.
    - **components/**: Modular UI components organized by feature (auth, cart, temples, etc.).
    - **contexts/**: React context providers for authentication, shopping cart, and site settings.
    - **hooks/**: Custom React hooks for data fetching and business logic.
    - **pages/**: Route-level components for different views (Admin, Vendor, Customer, etc.).
    - **integrations/supabase/**: Supabase client configuration and database types.
- **supabase/**: Backend configuration, including database migrations and Edge Functions.
- **public/**: Static assets and icons.

## Language & Runtime
**Language**: TypeScript  
**Version**: ^5.8.3  
**Build System**: Vite (v5.4.19)  
**Package Manager**: npm (v11.7.0) (Bun also supported via `bun.lockb`)

## Dependencies
**Main Dependencies**:
- **@supabase/supabase-js**: Backend interaction and authentication.
- **@tanstack/react-query**: Server state management and caching.
- **react-router-dom**: Client-side routing.
- **framer-motion**: Animation and interactive UI elements.
- **lucide-react**: Icon library.
- **mapbox-gl**: Interactive map integration.
- **recharts**: Data visualization for dashboards.
- **zod**: Schema validation for forms and data.
- **shadcn-ui**: Reusable UI component library based on Radix UI.

**Development Dependencies**:
- **typescript**: Language support.
- **vite**: Development server and build tool.
- **jest / ts-jest**: Testing framework.
- **eslint**: Code linting.
- **tailwindcss**: Utility-first CSS framework.

## Build & Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Testing
**Framework**: Jest with `ts-jest` and `jsdom`
**Test Location**: Configured for `src/` directory
**Naming Convention**: Typically `*.test.ts` or `*.spec.ts` (none found currently)
**Configuration**: `jest.config.js`, `src/setupTests.ts`

**Run Command**:
```bash
# Run tests (manual command as script is not in package.json)
npx jest
```
