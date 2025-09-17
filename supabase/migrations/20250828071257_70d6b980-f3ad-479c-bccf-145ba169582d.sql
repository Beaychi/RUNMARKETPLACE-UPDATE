-- Create admin user with specific credentials
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@runmarketplace.com',
  crypt('damilola', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "RUNMARKETPLACE", "role": "admin"}',
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Create admin profile
INSERT INTO public.profiles (
  user_id,
  full_name,
  email,
  role
) SELECT 
  u.id,
  'RUNMARKETPLACE',
  'admin@runmarketplace.com',
  'admin'::user_role
FROM auth.users u 
WHERE u.email = 'admin@runmarketplace.com'
ON CONFLICT (user_id) DO NOTHING;