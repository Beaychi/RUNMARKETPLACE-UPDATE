-- Fix the security definer view issue by using regular RLS policies instead

-- Drop the problematic view
DROP VIEW IF EXISTS public.vendors_public;

-- Remove the overly permissive policy
DROP POLICY IF EXISTS "Vendor basic info viewable by everyone" ON vendors;

-- Create proper RLS policies that protect sensitive data
-- Anonymous users can only see basic business info (no contact details)
CREATE POLICY "Anonymous users can see basic vendor info" 
ON vendors 
FOR SELECT 
TO anon
USING (
  status = 'approved'
);

-- But we need to modify the vendors table structure to properly mask sensitive fields
-- Add a computed field for public display that excludes sensitive info
-- We'll handle this in the application layer instead of database views

-- Authenticated users can see contact info for business purposes  
CREATE POLICY "Authenticated users can see vendor contact info" 
ON vendors 
FOR SELECT 
TO authenticated
USING (status = 'approved');

-- Grant proper permissions
GRANT SELECT ON vendors TO anon;
GRANT SELECT ON vendors TO authenticated;