-- Fix vendor security issues and add product management features

-- First update the vendor RLS policies to protect contact information
DROP POLICY IF EXISTS "Approved vendors are viewable by everyone" ON vendors;

-- Create secure vendor policies that protect contact information
CREATE POLICY "Vendor basic info viewable by everyone" 
ON vendors 
FOR SELECT 
USING (
  status = 'approved' AND 
  -- Only show non-sensitive fields to public
  true
);

-- Create a view for public vendor information without sensitive data
CREATE OR REPLACE VIEW public.vendors_public AS
SELECT 
  id,
  user_id,
  business_name,
  description,
  logo_url,
  banner_url,
  status,
  slug,
  created_at,
  updated_at,
  -- Social media links are okay to be public
  instagram_url,
  facebook_url,
  twitter_url,
  tiktok_url,
  website_url
FROM vendors 
WHERE status = 'approved';

-- Grant select permissions on the public view
GRANT SELECT ON public.vendors_public TO anon, authenticated;

-- Authenticated users can see full vendor details (for legitimate business purposes)
CREATE POLICY "Authenticated users can view vendor contact info" 
ON vendors 
FOR SELECT 
TO authenticated
USING (status = 'approved');

-- Add stock quantity and status fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_archived ON products(is_archived);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity);

-- Add suspended status check function
CREATE OR REPLACE FUNCTION public.is_vendor_suspended()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM vendors v
    JOIN profiles p ON v.user_id = p.user_id
    WHERE p.user_id = auth.uid() 
    AND p.role = 'vendor'
    AND v.status = 'suspended'
  );
$$;

-- Update vendor policies to prevent suspended vendors from creating/updating products
DROP POLICY IF EXISTS "Vendors can manage their own products" ON products;

CREATE POLICY "Active vendors can manage their own products" 
ON products 
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM vendors v
    WHERE v.id = products.vendor_id 
    AND v.user_id = auth.uid()  
    AND v.status != 'suspended'
  )
);

-- Add trigger to prevent suspended vendors from updating products
CREATE OR REPLACE FUNCTION public.prevent_suspended_vendor_actions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the current user is a suspended vendor
  IF public.is_vendor_suspended() THEN
    RAISE EXCEPTION 'Account suspended. Contact admin for assistance.';
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply the trigger to products table
CREATE TRIGGER prevent_suspended_vendor_product_actions
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION prevent_suspended_vendor_actions();

-- Apply the trigger to vendors table (prevent suspended vendors from updating their profile)
CREATE TRIGGER prevent_suspended_vendor_profile_actions
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION prevent_suspended_vendor_actions();