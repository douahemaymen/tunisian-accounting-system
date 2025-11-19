# Tech Stack

## Core Framework

- **Next.js 13.5.1** with App Router
- **React 18.2.0**
- **TypeScript 5.2.2** (strict mode disabled)
- **Node.js** runtime

## Database & ORM

- **PostgreSQL** database
- **Prisma 6.18.0** ORM with Prisma Client
- Database URL configured via `DATABASE_URL` environment variable

## Authentication

- **NextAuth.js 4.24.11** with JWT strategy
- **bcryptjs** for password hashing
- Prisma adapter for session management
- Role-based access control via middleware

## UI & Styling

- **Tailwind CSS 3.3.3** with custom configuration
- **Radix UI** components (dialogs, dropdowns, forms, etc.)
- **shadcn/ui** component patterns
- **Lucide React** for icons
- **class-variance-authority** for component variants
- **tailwind-merge** + **clsx** for className utilities (via `cn()` helper)

## Forms & Validation

- **React Hook Form 7.65.0** for form management
- **Zod 3.25.76** for schema validation
- **@hookform/resolvers** for integration

## Data Visualization

- **Recharts 2.15.4** for charts and graphs

## AI Integration

- **@google/generative-ai** (Gemini AI) for invoice scanning and accounting entry generation
- Configured via `GEMINI_API_KEY` environment variable

## File Handling

- **Cloudinary** for image storage and management
- **xlsx** for Excel export functionality

## State Management

- **Zustand 5.0.8** for global state
- **@tanstack/react-query 5.90.3** for server state

## Common Commands

```bash
# Development
npm run dev              # Start dev server on localhost:3000

# Build & Production
npm run build            # Create production build
npm start                # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript compiler check (no emit)

# Database
npx prisma generate      # Generate Prisma Client
npx prisma migrate dev   # Run migrations in development
npx prisma studio        # Open Prisma Studio GUI
npx prisma db push       # Push schema changes without migrations
```

## Environment Variables

Required in `.env` or `.env.local`:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Secret for NextAuth JWT
- `NEXTAUTH_URL`: Application URL
- `GEMINI_API_KEY`: Google Gemini API key
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Cloudinary credentials

## Build Configuration

- ESLint errors ignored during builds (`ignoreDuringBuilds: true`)
- Image optimization disabled (`unoptimized: true`)
- Custom webpack config for server/client externals (bufferutil, utf-8-validate, encoding)
- Path alias: `@/*` maps to project root
