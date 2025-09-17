-- Add matriculation number to profiles
ALTER TABLE public.profiles 
ADD COLUMN matric_number TEXT;

-- Add email verification status
ALTER TABLE public.profiles 
ADD COLUMN email_verified BOOLEAN DEFAULT false;

-- Add vendor-specific fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN business_name TEXT,
ADD COLUMN business_image_url TEXT,
ADD COLUMN brand_description TEXT,
ADD COLUMN encrypted_phone TEXT;

-- Add vendor approval status
ALTER TABLE public.profiles 
ADD COLUMN vendor_approved BOOLEAN DEFAULT false;

-- Create analytics table for tracking
CREATE TABLE public.analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'view', 'order_click', 'manual_purchase'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on analytics
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Analytics policies
CREATE POLICY "Vendors can view their own analytics" 
ON public.analytics 
FOR SELECT 
USING (vendor_id = auth.uid());

CREATE POLICY "System can insert analytics" 
ON public.analytics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all analytics" 
ON public.analytics 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Add trigger to update profiles updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add manual purchase confirmation to products
ALTER TABLE public.products 
ADD COLUMN manual_purchases INTEGER DEFAULT 0;