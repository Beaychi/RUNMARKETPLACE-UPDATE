-- Create admin profile directly (the auth user will be created via signup)
INSERT INTO public.profiles (
  user_id,
  full_name,
  email,
  role
) VALUES (
  gen_random_uuid(),
  'RUNMARKETPLACE',
  'admin@runmarketplace.com',
  'admin'::user_role
) ON CONFLICT (user_id) DO NOTHING;