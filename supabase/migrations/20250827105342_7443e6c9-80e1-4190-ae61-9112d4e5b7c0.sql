-- Create purchases table
CREATE TABLE public.purchases (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    product_id UUID NOT NULL,
    vendor_id UUID NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price_naira INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cash_on_delivery',
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on purchases
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Create policies for purchases
CREATE POLICY "Users can view their own purchases" 
ON public.purchases 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own purchases" 
ON public.purchases 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Vendors can view purchases of their products" 
ON public.purchases 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM vendors v 
    WHERE v.id = purchases.vendor_id 
    AND v.user_id = auth.uid()
));

CREATE POLICY "Admins can view all purchases" 
ON public.purchases 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'::user_role
));

CREATE POLICY "Admins can update all purchases" 
ON public.purchases 
FOR UPDATE 
USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'::user_role
));

-- Create trigger for purchases updated_at
CREATE TRIGGER update_purchases_updated_at
BEFORE UPDATE ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to encrypt phone numbers
CREATE OR REPLACE FUNCTION public.encrypt_phone(phone_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Simple encryption using built-in crypto functions
    -- In production, you might want to use a more sophisticated encryption method
    RETURN encode(digest(phone_text || 'run_marketplace_salt', 'sha256'), 'hex');
END;
$$;

-- Update existing vendors table to add encrypted phone
ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS encrypted_whatsapp TEXT;

-- Update existing profiles to add encrypted phone
UPDATE public.profiles 
SET encrypted_phone = public.encrypt_phone(phone) 
WHERE phone IS NOT NULL AND encrypted_phone IS NULL;

-- Update existing vendors to add encrypted phone
UPDATE public.vendors 
SET encrypted_whatsapp = public.encrypt_phone(whatsapp_number) 
WHERE whatsapp_number IS NOT NULL AND encrypted_whatsapp IS NULL;