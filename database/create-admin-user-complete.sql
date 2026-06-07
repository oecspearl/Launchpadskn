-- ============================================================
-- LaunchPad SKN — Create Admin User (COMPLETE, self-contained)
-- ============================================================
-- Run this in the Supabase SQL Editor.
--
-- This creates an admin user that can LOG IN, by writing to BOTH:
--   1. auth.users      -> Supabase Auth (handles authentication)
--   2. auth.identities -> required for email/password sign-in
--   3. public.users    -> app profile, linked by UUID, role = 'ADMIN'
--
-- Idempotent: safe to re-run. Re-running updates the password/profile.
--
-- >>> CHANGE THESE TWO VALUES BEFORE RUNNING <<<
--     admin_email    : the login email
--     admin_password : the login password (stored hashed via bcrypt)
-- ============================================================

DO $$
DECLARE
    admin_email    TEXT := 'admin@launchpadskn.com';
    admin_password TEXT := 'Admin123!';          -- change me
    admin_name     TEXT := 'Admin User';
    admin_phone    TEXT := '+1-869-555-0000';
    new_uid        UUID;
BEGIN
    -- pgcrypto provides crypt()/gen_salt() for bcrypt hashing
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    -- 1. Reuse existing auth user if present, otherwise create one --------
    SELECT id INTO new_uid FROM auth.users WHERE email = admin_email;

    IF new_uid IS NULL THEN
        new_uid := gen_random_uuid();

        INSERT INTO auth.users (
            instance_id, id, aud, role,
            email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data,
            created_at, updated_at
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_uid, 'authenticated', 'authenticated',
            admin_email,
            crypt(admin_password, gen_salt('bf')),
            now(),                                  -- mark email confirmed
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('name', admin_name, 'role', 'ADMIN'),
            now(), now()
        );

        -- 2. Identity row (required for email/password login) -------------
        INSERT INTO auth.identities (
            id, user_id, provider_id, provider, identity_data,
            created_at, updated_at
        )
        VALUES (
            gen_random_uuid(), new_uid, new_uid::text, 'email',
            jsonb_build_object('sub', new_uid::text, 'email', admin_email,
                               'email_verified', true),
            now(), now()
        );
    ELSE
        -- User already exists in Auth: reset password & confirm email
        UPDATE auth.users
        SET encrypted_password = crypt(admin_password, gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, now()),
            raw_user_meta_data = raw_user_meta_data
                                 || jsonb_build_object('name', admin_name, 'role', 'ADMIN'),
            updated_at = now()
        WHERE id = new_uid;
    END IF;

    -- 3. App profile in public.users, linked by UUID, role = ADMIN -------
    INSERT INTO public.users (
        id, name, email, role, phone, is_active,
        created_at, updated_at, is_first_login
    )
    VALUES (
        new_uid, admin_name, admin_email, 'ADMIN', admin_phone, true,
        now(), now(), false
    )
    ON CONFLICT (email) DO UPDATE
    SET id             = EXCLUDED.id,
        name           = EXCLUDED.name,
        role           = 'ADMIN',
        phone          = EXCLUDED.phone,
        is_active      = true,
        is_first_login = false,
        updated_at     = now();

    RAISE NOTICE 'Admin user ready: % (uuid %)', admin_email, new_uid;
END $$;

-- ============================================================
-- VERIFY
-- ============================================================
SELECT u.user_id,
       u.id   AS auth_uuid,
       u.email,
       u.name,
       u.role,
       u.is_active,
       (a.id IS NOT NULL)              AS exists_in_auth,
       (a.email_confirmed_at IS NOT NULL) AS email_confirmed
FROM public.users u
LEFT JOIN auth.users a ON a.id = u.id
WHERE u.email = 'admin@launchpadskn.com';

-- ============================================================
-- LOGIN: admin@launchpadskn.com / Admin123!   (whatever you set above)
-- ============================================================
