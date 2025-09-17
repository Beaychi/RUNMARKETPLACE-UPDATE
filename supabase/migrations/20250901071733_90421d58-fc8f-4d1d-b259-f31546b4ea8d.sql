-- Create storage buckets for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Create storage policies for product images
CREATE POLICY "Product images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Vendors can upload product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM vendors v 
    WHERE v.user_id = auth.uid() 
    AND v.status = 'approved'
  )
);

CREATE POLICY "Vendors can update their product images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM vendors v 
    WHERE v.user_id = auth.uid() 
    AND v.status = 'approved'
  )
);

CREATE POLICY "Vendors can delete their product images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM vendors v 
    WHERE v.user_id = auth.uid() 
    AND v.status = 'approved'
  )
);

-- Add social media fields to vendors table
ALTER TABLE vendors ADD COLUMN instagram_url text;
ALTER TABLE vendors ADD COLUMN facebook_url text;
ALTER TABLE vendors ADD COLUMN twitter_url text;
ALTER TABLE vendors ADD COLUMN tiktok_url text;
ALTER TABLE vendors ADD COLUMN website_url text;