-- Add unique constraint to business_name in vendors table
ALTER TABLE vendors ADD CONSTRAINT vendors_business_name_unique UNIQUE (business_name);

-- Create function to get or create brand from business name
CREATE OR REPLACE FUNCTION get_or_create_brand_from_business_name(business_name_param TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    brand_id_result UUID;
    brand_slug TEXT;
BEGIN
    -- Create slug from business name
    brand_slug := lower(regexp_replace(business_name_param, '[^a-zA-Z0-9]+', '-', 'g'));
    brand_slug := trim(both '-' from brand_slug);
    
    -- Check if brand already exists
    SELECT id INTO brand_id_result 
    FROM brands 
    WHERE name = business_name_param;
    
    -- If brand doesn't exist, create it
    IF brand_id_result IS NULL THEN
        INSERT INTO brands (name, slug, description)
        VALUES (
            business_name_param, 
            brand_slug,
            'Brand automatically created from vendor business name'
        )
        RETURNING id INTO brand_id_result;
    END IF;
    
    RETURN brand_id_result;
END;
$$;