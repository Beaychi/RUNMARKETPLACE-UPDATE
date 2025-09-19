-- Update products table status constraint to allow 'out_of_stock' status
ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS products_status_check;

ALTER TABLE public.products 
ADD CONSTRAINT products_status_check 
CHECK (status IN ('pending', 'active', 'inactive', 'out_of_stock'));

-- Update existing products that might have invalid status
UPDATE public.products 
SET status = 'inactive' 
WHERE status NOT IN ('pending', 'active', 'inactive', 'out_of_stock');
