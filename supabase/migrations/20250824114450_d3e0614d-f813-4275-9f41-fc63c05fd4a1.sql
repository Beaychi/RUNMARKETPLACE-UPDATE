-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('customer', 'vendor', 'admin');

-- Create categories table
CREATE TABLE public.categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES public.categories(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create brands table
CREATE TABLE public.brands (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user profiles table
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vendors table
CREATE TABLE public.vendors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    whatsapp_number TEXT NOT NULL,
    logo_url TEXT,
    banner_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id),
    brand_id UUID REFERENCES public.brands(id),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price_naira INTEGER NOT NULL,
    images TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wishlists table
CREATE TABLE public.wishlists (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Create policies for categories (public read, admin write)
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage categories" 
ON public.categories FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
));

-- Create policies for brands (public read, admin write)
CREATE POLICY "Brands are viewable by everyone" 
ON public.brands FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage brands" 
ON public.brands FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
));

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
));

-- Create policies for vendors
CREATE POLICY "Approved vendors are viewable by everyone" 
ON public.vendors FOR SELECT 
USING (status = 'approved');

CREATE POLICY "Users can create vendor profile" 
ON public.vendors FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Vendors can update their own profile" 
ON public.vendors FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all vendors" 
ON public.vendors FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
));

-- Create policies for products
CREATE POLICY "Active products are viewable by everyone" 
ON public.products FOR SELECT 
USING (status = 'active' AND EXISTS (
    SELECT 1 FROM public.vendors v 
    WHERE v.id = vendor_id AND v.status = 'approved'
));

CREATE POLICY "Vendors can manage their own products" 
ON public.products FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.vendors v 
    WHERE v.id = vendor_id AND v.user_id = auth.uid()
));

CREATE POLICY "Admins can view all products" 
ON public.products FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
));

CREATE POLICY "Admins can update all products" 
ON public.products FOR UPDATE 
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
));

-- Create policies for wishlists
CREATE POLICY "Users can view their own wishlist" 
ON public.wishlists FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own wishlist" 
ON public.wishlists FOR ALL 
USING (auth.uid() = user_id);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brands_updated_at
    BEFORE UPDATE ON public.brands
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at
    BEFORE UPDATE ON public.vendors
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, email, role)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'full_name',
        NEW.email,
        'customer'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample categories
INSERT INTO public.categories (name, slug, description) VALUES
('Men''s Fashion', 'mens-fashion', 'Clothing and accessories for men'),
('Women''s Fashion', 'womens-fashion', 'Clothing and accessories for women'),
('Electronics', 'electronics', 'Electronic devices and gadgets'),
('Phone Gadgets', 'phone-gadgets', 'Phone accessories and gadgets'),
('Beauty & Health', 'beauty-health', 'Beauty products and health items'),
('Accessories', 'accessories', 'Fashion and tech accessories'),
('Food & Groceries', 'food-groceries', 'Food items and groceries'),
('Home & Living', 'home-living', 'Home decor and furniture'),
('Sports & Fitness', 'sports-fitness', 'Sports equipment and fitness gear'),
('Books & Education', 'books-education', 'Books and educational materials');

-- Insert sample brands
INSERT INTO public.brands (name, slug, description) VALUES
('Nike', 'nike', 'Athletic footwear and apparel'),
('Samsung', 'samsung', 'Electronics and mobile devices'),
('Apple', 'apple', 'Technology products'),
('Adidas', 'adidas', 'Sports and lifestyle brand'),
('Sony', 'sony', 'Electronics and entertainment'),
('LG', 'lg', 'Home appliances and electronics'),
('Puma', 'puma', 'Sports and lifestyle products'),
('HP', 'hp', 'Computer hardware and software'),
('Dell', 'dell', 'Computer technology'),
('Canon', 'canon', 'Cameras and imaging products');