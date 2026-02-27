-- Seed admin account
-- Email: admin@233plug.com
-- Password: Admin123! (change after first login)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  admin_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@233plug.com') THEN
    UPDATE public.profiles SET role = 'super_admin' WHERE email = 'admin@233plug.com';
    RETURN;
  END IF;

  admin_id := uuid_generate_v4();

  INSERT INTO auth.users (
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
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    admin_id,
    'authenticated',
    'authenticated',
    'admin@233plug.com',
    crypt('Admin123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Admin"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    uuid_generate_v4(),
    admin_id,
    format('{"sub":"%s","email":"admin@233plug.com"}', admin_id::text)::jsonb,
    'email',
    admin_id::text,
    now(),
    now(),
    now()
  );

  INSERT INTO public.profiles (id, name, email, role, referral_code)
  VALUES (admin_id, 'Admin', 'admin@233plug.com', 'super_admin', 'ADMIN001')
  ON CONFLICT (id) DO UPDATE SET role = 'super_admin';
END $$;
