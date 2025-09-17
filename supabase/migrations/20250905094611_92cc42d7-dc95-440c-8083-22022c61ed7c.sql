-- Update the get_or_create_brand_from_business_name function to include logo
CREATE OR REPLACE FUNCTION public.get_or_create_brand_from_business_name(
    business_name_param text, 
    logo_url_param text DEFAULT NULL
)
RETURNS uuid
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
        INSERT INTO brands (name, slug, description, logo_url)
        VALUES (
            business_name_param, 
            brand_slug,
            'Brand created from vendor business',
            logo_url_param
        )
        RETURNING id INTO brand_id_result;
    ELSE
        -- Update existing brand logo if provided
        IF logo_url_param IS NOT NULL THEN
            UPDATE brands 
            SET logo_url = logo_url_param 
            WHERE id = brand_id_result;
        END IF;
    END IF;
    
    RETURN brand_id_result;
END;
$$;