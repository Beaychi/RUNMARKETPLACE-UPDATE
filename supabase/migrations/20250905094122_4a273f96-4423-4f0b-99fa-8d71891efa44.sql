-- Create function to handle vendor registration
CREATE OR REPLACE FUNCTION public.handle_vendor_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create vendor record if role is vendor and vendor record doesn't exist
  IF NEW.role = 'vendor' AND OLD.role != 'vendor' THEN
    -- Check if vendor record already exists
    IF NOT EXISTS (
      SELECT 1 FROM vendors WHERE user_id = NEW.user_id
    ) THEN
      -- Create vendor record with business info from profile
      INSERT INTO vendors (
        user_id,
        business_name,
        slug,
        description,
        whatsapp_number,
        status
      ) VALUES (
        NEW.user_id,
        COALESCE(NEW.business_name, NEW.full_name, 'Business'),
        lower(regexp_replace(COALESCE(NEW.business_name, NEW.full_name, 'business'), '[^a-zA-Z0-9]+', '-', 'g')),
        NEW.brand_description,
        COALESCE(NEW.phone, ''),
        'pending'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for vendor registration
DROP TRIGGER IF EXISTS on_vendor_role_change ON profiles;
CREATE TRIGGER on_vendor_role_change
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN (NEW.role = 'vendor')
  EXECUTE FUNCTION handle_vendor_registration();

-- Also ensure existing vendor profiles have vendor records
INSERT INTO vendors (
  user_id,
  business_name,
  slug,
  description,
  whatsapp_number,
  status
)
SELECT 
  p.user_id,
  COALESCE(p.business_name, p.full_name, 'Business'),
  lower(regexp_replace(COALESCE(p.business_name, p.full_name, 'business-' || p.user_id::text), '[^a-zA-Z0-9]+', '-', 'g')),
  p.brand_description,
  COALESCE(p.phone, ''),
  CASE 
    WHEN p.vendor_approved = true THEN 'approved'
    ELSE 'pending'
  END
FROM profiles p
LEFT JOIN vendors v ON p.user_id = v.user_id
WHERE p.role = 'vendor' AND v.user_id IS NULL;