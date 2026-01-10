---
description: Repository Information Overview
alwaysApply: true
---

# Temple Finder Pro - Repository Information

## Summary

A modern full-stack web application built with React and Vite for temple discovery, booking, and e-commerce. The platform serves multiple user roles (customers, vendors, and administrators) with features including temple browsing, vendor storefronts, booking management, inventory control, social feeds, and comprehensive admin dashboards. Integrates with Supabase for backend services, authentication, and database management.

## Structure

- **`src/`** - Main application source code with pages, components, contexts, hooks, and utilities
- **`src/app/`** - Application configuration and setup files
- **`src/assets/`** - Static assets and images
- **`src/components/`** - Reusable React components (UI, auth, admin, vendor, cart, chat)
- **`src/contexts/`** - React context providers for global state (Auth, Cart, Site Settings)
- **`src/hooks/`** - Custom React hooks
- **`src/i18n/`** - Internationalization configuration
- **`src/integrations/`** - External service integrations (Supabase client)
- **`src/lib/`** - Utility functions and helpers
- **`src/pages/`** - Page components for routing (customer, vendor, admin dashboards, auth, checkout)
- **`supabase/`** - Supabase configuration, migrations, and serverless functions
- **`public/`** - Static public assets (favicon, robots.txt, placeholder images)

## Language & Runtime

**Language**: TypeScript 5.8.3  
**Runtime**: Node.js (with npm or Bun package manager)  
**Framework**: React 18.3.1  
**Build Tool**: Vite 5.4.19  
**Package Manager**: npm (with package-lock.json) / Bun (bun.lockb)

## Dependencies

**Core Frontend Dependencies**:
- React & React DOM 18.3.1 - UI framework
- React Router DOM 6.30.1 - Client-side routing
- @tanstack/react-query 5.83.0 - Server state management
- React Hook Form 7.61.1 - Form state management
- Zod 3.25.76 - Schema validation

**UI & Styling**:
- Tailwind CSS 3.4.17 - Utility-first CSS framework
- shadcn-ui components - Radix UI-based component library
- Lucide React 0.462.0 - Icon library
- Framer Motion 12.23.26 - Animation library
- Embla Carousel React 8.6.0 - Carousel component

**Features & Integrations**:
- @supabase/supabase-js 2.89.0 - Supabase client library
- mapbox-gl 3.17.0 - Maps integration
- i18next & react-i18next 25.7.3 - Internationalization
- React Helmet Async 2.0.5 - Meta tags management
- Sonner 1.7.4 - Toast notifications
- @dnd-kit/* - Drag and drop functionality
- Recharts 2.15.4 - Chart visualization

**Development Dependencies**:
- TypeScript 5.8.3 - Static type checking
- Jest 30.2.0 - Testing framework with ts-jest preset
- ESLint 9.32.0 - Linting
- @vitejs/plugin-react-swc - Vite React plugin with SWC
- Tailwind CSS 3.4.17 - Styling
- PostCSS & Autoprefixer - CSS processing

## Build & Installation

**Install dependencies**:
```bash
npm install
npm run dev
```

**Build for production**:
```bash
npm run build
```

**Development preview**:
```bash
npm run build:dev
npm run preview
```

**Linting**:
```bash
npm run lint
```

**Development server**: Runs on `http://[::]:8080` (IPv6 localhost on port 8080)

## Testing

**Framework**: Jest 30.2.0 with ts-jest  
**Test Environment**: jsdom  
**Configuration File**: `jest.config.js`  
**Setup File**: `src/setupTests.ts`  
**Naming Convention**: `*.test.ts` or `*.test.tsx`

**Run tests**:
```bash
npm test
```

## Docker & Deployment

**Deployment**: Configured for Vercel via `vercel.json`  
**Vercel Configuration**: Single-page app rewrites to `index.html`  
**Docker**: No Dockerfile found; application deployed as serverless function

## Main Entry Points

**Application Entry**: `src/main.tsx` - React DOM root creation  
**Application Root**: `src/App.tsx` - Main app component with routing, providers, and layout  
**HTML Template**: `index.html` - Vite entry point with root div

## Key Features & Components

- **Multi-role authentication** - Customers, vendors, administrators with protected routes
- **Temple browsing and details** - Temple listings with detailed information
- **Product catalog** - E-commerce product listings and details
- **Shopping cart** - Cart management and checkout flow
- **Vendor dashboard** - Product management, order tracking, analytics, inventory, earnings, bookings
- **Admin dashboard** - Vendor/user/temple/booking management, vendor applications, vendor balance tracking
- **Customer dashboard** - Orders, favorites, profile management
- **Chat system** - Real-time messaging between users
- **Social feed** - User-generated content and social interactions
- **Booking system** - Temple service bookings and management
- **Internationalization** - Multi-language support

## Configuration Files

- **`tailwind.config.ts`** - Tailwind CSS theme configuration with custom colors (temple-gold, temple-saffron, temple-maroon)
- **`tsconfig.json`** - TypeScript compiler options with path aliases (@/*)
- **`vite.config.ts`** - Vite build configuration with React SWC plugin and path alias
- **`components.json`** - shadcn-ui component configuration
- **`.env`** - Supabase project credentials (VITE_SUPABASE_*)
- **`supabase/config.toml`** - Supabase project configuration with OTP functions (send-otp, verify-otp)
