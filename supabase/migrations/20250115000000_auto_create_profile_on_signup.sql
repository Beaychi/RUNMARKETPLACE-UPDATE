-- Create function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (
    user_id,
    full_name,
    email,
    role,
    matric_number,
    business_name,
    phone,
    encrypted_phone,
    vendor_approved
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')::user_role,
    COALESCE(NEW.raw_user_meta_data->>'matric_number', ''),
    COALESCE(NEW.raw_user_meta_data->>'business_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'encrypted_phone', ''),
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'customer') = 'vendor' THEN false
      ELSE NULL
    END
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to automatically create vendor record when profile role is vendor
CREATE OR REPLACE FUNCTION public.handle_vendor_profile_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create vendor record if role is vendor and vendor record doesn't exist
  IF NEW.role = 'vendor' AND (OLD IS NULL OR OLD.role != 'vendor') THEN
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
        encrypted_whatsapp,
        status
      ) VALUES (
        NEW.user_id,
        COALESCE(NEW.business_name, NEW.full_name, 'Business'),
        lower(regexp_replace(COALESCE(NEW.business_name, NEW.full_name, 'business'), '[^a-zA-Z0-9]+', '-', 'g')),
        NEW.brand_description,
        COALESCE(NEW.phone, ''),
        COALESCE(NEW.encrypted_phone, ''),
        'pending'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for vendor profile creation
DROP TRIGGER IF EXISTS on_vendor_profile_created ON profiles;
CREATE TRIGGER on_vendor_profile_created
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW
  WHEN (NEW.role = 'vendor')
  EXECUTE FUNCTION public.handle_vendor_profile_creation();
