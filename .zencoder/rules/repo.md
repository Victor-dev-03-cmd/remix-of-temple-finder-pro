---
description: Repository Information Overview
alwaysApply: true
---

# asroz Information

## Summary
A modern social commerce platform designed for temple discovery and product sales. The application features an Instagram-style social feed, vendor-to-vendor real-time chat, and a robust e-commerce system with variant selection and cart management. Built using React, Vite, and Supabase.

## Structure
- **src/components**: Reusable UI components including layout, auth, products, and shadcn/ui components.
- **src/pages**: Main application views such as SocialFeed, Profile, ProductDetail, and VendorChat.
- **src/contexts**: Global state management for Authentication and Shopping Cart.
- **src/hooks**: Custom hooks for Supabase data fetching (products, variants, reviews, social features).
- **src/integrations**: Supabase client configuration and auto-generated types.
- **src/lib**: Utility functions and shared logic (e.g., category labels, formatting).
- **supabase**: Contains edge functions and database migrations for the Supabase backend.

## Language & Runtime
**Language**: TypeScript  
**Runtime**: Node.js (Vite-based development)  
**Build System**: Vite  
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- `@supabase/supabase-js`: Backend-as-a-Service integration
- `react`, `react-router-dom`: Frontend framework and routing
- `@radix-ui/*`: Unstyled, accessible UI primitives
- `framer-motion`: Animation library
- `lucide-react`: Icon set
- `tailwindcss`, `class-variance-authority`: Styling and component variants
- `zod`, `react-hook-form`: Schema validation and form management

**Development Dependencies**:
- `vite`, `typescript`, `eslint`: Build and linting tools
- `jest`, `ts-jest`: Testing framework

## Build & Installation
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Testing
**Framework**: Jest
**Test Location**: `src/` (indicated by `setupTests.ts`)
**Naming Convention**: `*.test.tsx`, `*.spec.ts`
**Configuration**: `jest.config.js`

**Run Command**:
```bash
npm test
```

## Main Files & Resources
- **Entry Points**: `src/main.tsx` (frontend), `supabase/functions/` (edge functions)
- **Configuration**: `tailwind.config.ts`, `vite.config.ts`, `components.json`
- **Database Schema**: Managed via Supabase migrations in `supabase/migrations/`
