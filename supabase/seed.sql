insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  phone_change
)
values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000101',
  'authenticated',
  'authenticated',
  'receptionist@barberqueue.local',
  crypt('ChangeMe123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"first_name":"Receptionist","last_name":"User","phone":""}'::jsonb,
  now(),
  now(),
  '',
  '',
  ''
)
on conflict (id) do update
set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
values (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000101',
  '{"sub":"00000000-0000-0000-0000-000000000101","email":"receptionist@barberqueue.local","email_verified":true}'::jsonb,
  'email',
  'receptionist@barberqueue.local',
  now(),
  now(),
  now()
)
on conflict (provider, provider_id) do update
set
  identity_data = excluded.identity_data,
  updated_at = now();

insert into public.profiles (id, first_name, last_name, phone)
values (
  '00000000-0000-0000-0000-000000000101',
  'Receptionist',
  'User',
  ''
)
on conflict (id) do update
set
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  phone = excluded.phone,
  updated_at = now();

insert into public.user_roles (user_id, role)
values ('00000000-0000-0000-0000-000000000101', 'receptionist')
on conflict (user_id) do update
set role = excluded.role, updated_at = now();
