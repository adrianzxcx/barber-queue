# Barber Queue

A modern, comprehensive queue management system for barbershops, featuring Role-Based Access Control (RBAC), real-time updates, and an intuitive user interface.

## Tech Stack

- **Framework**: Next.js (App Router, React 19)
- **Styling**: Tailwind CSS v4, shadcn/ui, @base-ui/react
- **Database & Auth**: Supabase
- **Icons**: Phosphor Icons

## Prerequisites

Before you begin, ensure you have met the following requirements:
- **Node.js**: `v20` or higher
- **Package Manager**: `npm`, `yarn`, `pnpm`, or `bun`
- **Supabase CLI**: For managing database migrations

## Installation Guide

1. **Clone the repository:**
   ```bash
   git clone https://github.com/adrianzxcx/barber-queue.git
   cd barber-queue
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

## Environment Setup

1. **Create Environment File:**
   Copy the `.env.example` file to create your local `.env` file.
   ```bash
   cp .env.example .env
   ```

2. **Configure Environment Variables:**
   Update `.env` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-publishable-or-anon-key
   ```

## Database & Auth Setup

The project uses Supabase for database and authentication with custom RBAC (Role-Based Access Control) using Custom Access Token Hooks.

1. **Link your Supabase Project:**
   Authenticate with the Supabase CLI and link your project:
   ```bash
   npx supabase login
   npm run supabase:link
   ```

2. **Push Migrations:**
   Push the database schema and RBAC functions to your linked project:
   ```bash
   npm run supabase:push
   ```

3. **Seed Initial Data (Optional but Recommended):**
   Run the `supabase/seed.sql` script via the Supabase SQL editor to create the initial `receptionist` user. 
   *(Note: For more advanced Auth & Edge Functions configuration such as email delivery via Brevo, please refer to the detailed instructions in [supabase/README.md](./supabase/README.md)).*

## Running the Server

Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

## Project Structure

- `src/app` - Next.js App Router pages (`/admin`, `/user`, `/auth`, etc.)
- `src/components` - Reusable UI components (shadcn/ui, layouts, landing page)
- `src/lib` - Utility functions, Supabase server/client helpers
- `supabase/` - Supabase config, migrations, and seed scripts

## Available Scripts

- `npm run dev` - Starts the development server
- `npm run build` - Builds the app for production
- `npm run start` - Runs the built application
- `npm run lint` - Runs ESLint checks
- `npm run supabase:link` - Links local project to your remote Supabase project
- `npm run supabase:push` - Pushes database schema changes to Supabase
