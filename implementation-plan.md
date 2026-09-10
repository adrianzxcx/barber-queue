# Backend Implementation Plan

This plan creates the non-AI backend for Barber Queue using the existing Next.js App Router, Supabase Auth, Supabase Postgres, Row Level Security, and realtime subscriptions. AI styling features are intentionally excluded and should be handled in a later plan.

## Goals

- Replace client-only and `localStorage` queue simulation with durable Supabase data.
- Keep Supabase as the system of record for auth, RBAC, queue state, services, staff, settings, and audit logs.
- Use Next.js Server Components for reads, Server Actions for UI mutations, and Route Handlers only for external/webhook-style HTTP endpoints.
- Enforce authorization in both Server Actions and database RLS policies.
- Add realtime queue updates for customer and receptionist dashboards.

## Current Starting Point

- Auth and RBAC are already partially implemented in `supabase/migrations/20260605160000_auth_rbac.sql`.
- Server/client Supabase helpers already exist in `src/lib/supabase/server.ts` and `src/lib/supabase/client.ts`.
- Middleware already redirects users by role through `src/middleware.ts`.
- Admin and user pages currently hold most business data in component state or `localStorage`.
- Existing frontend domains to support: services, barbers, queue tickets, shifts, shop settings, logs, customer ticket history, and dashboard metrics.

## Architecture Decisions

- Database: Supabase Postgres with migrations under `supabase/migrations`.
- Auth: Supabase Auth with existing `customer` and `receptionist` roles.
- Authorization: RLS for table-level access, plus role checks in every Server Action.
- Reads: Server Components and server-side query helpers in `src/lib/queries`.
- Mutations: Server Actions in `src/app/**/actions.ts` or shared action modules when multiple routes need the same behavior.
- Realtime: Supabase Realtime channels from client components for queue, barber status, service availability, and shop status updates.
- Validation: Zod schemas for all Server Action inputs and Route Handler payloads.
- Auditability: Each mutation that affects operations writes an `activity_logs` row in the same logical flow.

## Phase 1: Database Model

Create a new migration for the operational schema.

Tables:

- `shop_settings`
  - Singleton-style settings row.
  - Fields: `id`, `shop_is_open`, `skip_expiry_seconds`, `sound_enabled`, `created_at`, `updated_at`.

- `services`
  - Public catalog managed by receptionists.
  - Fields: `id`, `name`, `slug`, `description`, `category`, `price_cents`, `duration_minutes`, `is_active`, `sort_order`, `created_at`, `updated_at`.
  - Add unique constraints for `slug` and normalized `name`.

- `barbers`
  - Staff profiles and display metadata.
  - Fields: `id`, `display_name`, `specialty`, `rank`, `image_url`, `image_position`, `is_active`, `created_at`, `updated_at`.

- `barber_shifts`
  - Daily/session availability state separate from the long-lived barber profile.
  - Fields: `id`, `barber_id`, `status`, `started_at`, `ended_at`, `current_ticket_id`, `created_at`, `updated_at`.
  - Status enum: `available`, `busy`, `unavailable`.

- `queue_tickets`
  - Active and historical queue records.
  - Fields: `id`, `ticket_number`, `customer_id`, `customer_name_snapshot`, `service_id`, `preferred_barber_id`, `assigned_barber_id`, `status`, `joined_at`, `called_at`, `skipped_at`, `expired_at`, `completed_at`, `canceled_at`, `created_by`, `updated_at`.
  - Status enum: `waiting`, `being_served`, `skipped`, `expired`, `completed`, `canceled`.
  - Add partial unique index so each customer can have only one active ticket.

- `activity_logs`
  - Immutable operational event stream.
  - Fields: `id`, `actor_id`, `actor_role`, `event_type`, `entity_type`, `entity_id`, `message`, `metadata`, `created_at`.

Database helpers:

- `public.is_receptionist()` reads JWT `app_role`.
- `public.touch_updated_at()` trigger for mutable tables.
- `public.next_ticket_number()` generates daily ticket numbers.
- `public.expire_stale_skipped_tickets()` expires skipped tickets older than `shop_settings.skip_expiry_seconds`.

Seed data:

- Add initial services from the current customer services page.
- Add initial barber roster from the current dashboard/profile mock data.
- Add one default `shop_settings` row.

## Phase 2: RLS and Permissions

Policies:

- `services`
  - Anyone authenticated can read active services.
  - Receptionists can read all services and insert/update/delete or soft-delete.

- `barbers`
  - Authenticated users can read active barber profiles.
  - Receptionists can manage all barber profiles.

- `barber_shifts`
  - Authenticated users can read current shift state.
  - Receptionists can start/end shifts and update status.

- `queue_tickets`
  - Customers can read their own tickets.
  - Customers can create one active ticket for themselves when the shop is open.
  - Customers can cancel their own waiting or skipped ticket.
  - Receptionists can read and mutate all tickets.

- `shop_settings`
  - Authenticated users can read.
  - Receptionists can update.

- `activity_logs`
  - Receptionists can read all logs.
  - Customers can read their own customer-facing events if needed.
  - Writes happen through privileged database functions or validated Server Actions, not direct anonymous inserts.

Security checks:

- Never trust submitted role, customer id, price, duration, or ticket status from the browser.
- Re-check role and ownership in every Server Action even when RLS should also block bad access.
- Use database transactions or RPC functions for multi-step queue mutations where partial updates would corrupt the queue.

## Phase 3: Server Library Structure

Add backend-facing modules:

- `src/lib/db/types.ts`
  - Shared TypeScript types that mirror Supabase rows and enums.

- `src/lib/validation/*.ts`
  - Zod schemas for service, barber, settings, and queue action inputs.

- `src/lib/auth/session.ts`
  - Helpers like `requireUser()`, `requireReceptionist()`, and `getCurrentRole()`.

- `src/lib/queries/services.ts`
  - Service catalog reads.

- `src/lib/queries/barbers.ts`
  - Barber roster and current shift reads.

- `src/lib/queries/queue.ts`
  - Active queue, customer current ticket, history, and dashboard stats.

- `src/lib/queries/settings.ts`
  - Shop setting reads.

- `src/lib/queries/logs.ts`
  - Activity log reads and filters.

Keep query modules server-only where possible and use Supabase clients from `src/lib/supabase/server.ts`.

## Phase 4: Server Actions

Customer actions:

- `joinQueue(input)`
  - Checks shop status.
  - Checks customer has no active ticket.
  - Validates requested service and optional preferred barber.
  - Creates ticket with generated ticket number.
  - Writes activity log.
  - Revalidates user dashboard and queue pages.

- `cancelMyTicket(ticketId)`
  - Confirms ownership and active status.
  - Marks ticket canceled.
  - Writes activity log.
  - Revalidates customer views.

Receptionist queue actions:

- `callTicket(ticketId, barberId)`
  - Confirms receptionist role.
  - Confirms barber is available or supports explicit override rules.
  - Marks ticket `being_served`.
  - Updates shift to `busy`.
  - Writes activity log.

- `callNextForBarber(barberId)`
  - Picks the next eligible ticket in FIFO order.
  - Prefers tickets for that barber, then general queue based on business rules.
  - Calls the selected ticket atomically.

- `skipTicket(ticketId)`
  - Marks ticket skipped and sets `skipped_at`.
  - Writes activity log.

- `restoreTicket(ticketId)`
  - Moves skipped or expired ticket back to waiting if allowed.
  - Clears `skipped_at` and `expired_at`.
  - Writes activity log.

- `expireTicket(ticketId)` and `clearExpiredTickets()`
  - Marks expired tickets as expired/canceled according to final product rules.
  - Writes activity log.

- `completeTicket(ticketId)`
  - Marks ticket completed.
  - Releases barber shift back to available.
  - Writes activity log and updates served counts through queries.

Admin management actions:

- Services: create, update, toggle active, delete/soft-delete.
- Barbers: create, update, toggle active, delete/soft-delete.
- Shifts: start shift, end shift, set availability.
- Settings: update shop open status, skipped ticket expiry, sound setting.
- Logs: clear logs only if the product truly needs deletion; prefer archiving or filtering.

## Phase 5: Realtime and Timers

Realtime subscriptions:

- Subscribe customers to their own active ticket and public queue summaries.
- Subscribe receptionist dashboard to `queue_tickets`, `barber_shifts`, `shop_settings`, and `activity_logs`.
- Subscribe landing page status banner to `shop_settings`.

Timer behavior:

- Display skipped countdowns client-side from `skipped_at` plus `skip_expiry_seconds`.
- Run expiration on the server when dashboard data loads and before queue mutations.
- Optionally add a scheduled Supabase cron job to call `expire_stale_skipped_tickets()` every minute.

Consistency rules:

- Realtime updates should refresh local display, but database state is authoritative.
- Server Actions should revalidate the relevant paths after successful mutations.
- Queue ordering should always use persisted timestamps, not local array order.

## Phase 6: Page Migration

Migrate pages gradually so each screen remains usable.

Admin:

- `src/app/admin/dashboard/page.tsx`
  - Load active queue, barbers, shifts, settings, and stats from server queries.
  - Pass Server Actions into client tab components or create small action-aware client wrappers.
  - Remove mock customer generation from production controls or hide it behind a development-only flag.

- `src/app/admin/services/page.tsx`
  - Load services from database.
  - Replace `setServices` mutations with service Server Actions.

- `src/app/admin/profiles/page.tsx`
  - Load barbers and active shifts.
  - Replace profile and shift state updates with Server Actions.

- `src/app/admin/settings/page.tsx`
  - Load settings from database.
  - Replace `localStorage` shop status with persisted settings.

- `src/app/admin/logs/page.tsx`
  - Load paginated logs from database.
  - Add filters for type, search, and date range.

Customer:

- `src/app/user/dashboard/page.tsx`
  - Load active ticket, services, barbers, shift state, and estimated waits from server queries.
  - Replace `localStorage` active ticket with `queue_tickets`.
  - Remove AI card data dependencies from this backend phase.

- `src/app/user/my-queue/page.tsx`
  - Load current ticket and history from `queue_tickets`.
  - Replace local history storage.

- `src/app/user/services/page.tsx`
  - Load active services from `services`.

- `src/app/user/barbers/page.tsx`
  - Load active barbers and current shift status from `barbers` and `barber_shifts`.

Landing:

- Replace static service/status data with public-safe server reads for active services and shop status.

## Phase 7: API Route Handlers

Do not create REST endpoints for normal app UI mutations; use Server Actions. Add Route Handlers only where direct HTTP is needed.

Potential route handlers:

- `GET /api/health`
  - Returns app, database, and Supabase connectivity health for deployment monitoring.

- `POST /api/queue/expire`
  - Protected cron endpoint if Supabase cron is not used.

- `GET /api/public/queue-summary`
  - Optional public display endpoint for a lobby screen, if needed later.

## Phase 8: Testing and Verification

Database:

- Test migrations apply cleanly with Supabase CLI.
- Test RLS policies manually with customer and receptionist accounts.
- Test each RPC/function with normal and unauthorized inputs.

Application:

- Run `npm run lint`.
- Run `npm run build`.
- Manually verify auth redirects by role.
- Verify customer can join, cancel, and view history.
- Verify receptionist can call, skip, restore, expire, complete, and manage settings.
- Verify two active tickets cannot be created for one customer.
- Verify realtime updates appear across two browser sessions.

Edge cases:

- Shop closed blocks new queue joins.
- Service inactive blocks new queue joins.
- Barber unavailable blocks preferred barber selection.
- Busy barber cannot receive a second active ticket unless an explicit override rule exists.
- Skipped ticket expires after configured duration.
- Customer cancellation releases only their own ticket.
- Removing a barber does not orphan active tickets without a clear fallback.

## Phase 9: Deployment

- Add new environment variables only if required; keep browser-safe values prefixed with `NEXT_PUBLIC_`.
- Push migrations with `npm run supabase:push`.
- Seed operational data once per environment.
- Enable Realtime on required tables in Supabase.
- Configure cron for skipped-ticket expiry if selected.
- Build and deploy the Next.js app.
- Smoke test with one receptionist account and one customer account.

## Suggested Build Order

1. Add schema migration, enums, indexes, triggers, and seed data.
2. Add RLS policies and role helper functions.
3. Add query modules and auth helper utilities.
4. Add queue Server Actions and replace customer join/cancel flows.
5. Add receptionist queue actions and migrate admin dashboard.
6. Add service, barber, shift, settings, and log actions.
7. Add realtime subscriptions to migrated client components.
8. Remove or gate mock/localStorage flows.
9. Add tests/checklists and run deployment verification.

## Explicitly Deferred

- AI style consultant integration.
- Face analysis, image upload, style recommendations, or model/provider setup.
- AI-related storage buckets, prompt handling, or inference APIs.
- Payment processing.
- Multi-branch shop support.
- SMS/email customer notifications beyond existing auth email setup.
