# Supabase Auth Setup

This app uses Supabase Auth for registration and login. Email OTP delivery is delegated to Brevo through the `send-auth-email` Supabase Edge Function so the Brevo API key stays server-side.

## 1. App Environment

Fill these in `.env` from your Supabase project API settings:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

The Brevo variables in `.env.example` are for Supabase Edge Function secrets, not browser code.

## 2. Database and JWT Role Claim

Run `supabase/migrations/20260605160000_auth_rbac.sql`.

Then enable the Supabase Auth custom access token hook and point it to:

```text
public.custom_access_token_hook
```

The hook reads `public.user_roles` and adds `app_role` to the JWT. Roles are never accepted from browser-submitted metadata.

## 3. Receptionist Seed

Run `supabase/seed.sql` after the migration. Update the seeded email before production use:

```text
receptionist@barberqueue.local
```

The seeded password is `ChangeMe123!`, but the app login flow uses email OTP.

## 4. Brevo OTP Delivery

The repository is configured for project `kidghypdqgyerbqyfmhe` in `supabase/config.toml`. After authenticating the Supabase CLI, link the project and push the migration:

```bash
npx supabase login
npm run supabase:link
npm run supabase:push
```

Deploy the Edge Function. The `supabase/config.toml` entry disables JWT verification for this function because Supabase Auth hooks call it server-to-server, not as a logged-in app user:

```bash
npm run supabase:functions:deploy
```

Set its secrets:

```bash
npx supabase secrets set BREVO_API_KEY=your-brevo-key
npx supabase secrets set BREVO_SENDER_EMAIL=no-reply@your-domain.com
npx supabase secrets set BREVO_SENDER_NAME=BarberQueue
npx supabase secrets set SEND_EMAIL_HOOK_SECRET=v1,whsec_generate-a-long-random-secret
```

In Supabase Auth settings, enable email confirmations and configure the Send Email Auth Hook to call the deployed function URL with the same bearer secret.

Use this function URL:

```text
https://kidghypdqgyerbqyfmhe.supabase.co/functions/v1/send-auth-email
```

## 5. Dashboard Hook Settings

In the Supabase dashboard:

1. Go to Authentication > Hooks.
2. Enable the Custom Access Token hook.
3. Select the Postgres function hook and choose `public.custom_access_token_hook`.
4. Enable the Send Email hook.
5. Set the hook URL to the `send-auth-email` function URL above.
6. Use the same Send Email hook secret configured in `SEND_EMAIL_HOOK_SECRET`.

The receptionist seed can be run from the SQL editor after the migration has completed.
