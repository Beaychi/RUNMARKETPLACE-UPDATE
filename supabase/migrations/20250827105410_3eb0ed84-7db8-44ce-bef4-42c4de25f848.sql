-- Fix infinite recursion in profiles RLS policy
-- Drop the problematic policy first
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'::user_role
    );
$$;

-- Recreate the admin policy using the security definer function
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin());

-- Also fix the encrypt_phone function search path
CREATE OR REPLACE FUNCTION public.encrypt_phone(phone_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
    -- Simple encryption using built-in crypto functions
    RETURN encode(digest(phone_text || 'run_marketplace_salt', 'sha256'), 'hex');
END;
$$;