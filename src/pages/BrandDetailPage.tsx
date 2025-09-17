import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Package, Store } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Brand = Database['public']['Tables']['brands']['Row'];

interface Product {
  id: string;
  name: string;
  slug: string;
  price_naira: number;
  images: string[];
  status: string;
  vendor_id: string;
  vendor: {
    business_name: string;
    whatsapp_number: string;
  };
  category: {
    name: string;
  };
  brand?: {
    name: string;
  };
}

export default function BrandDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchBrandAndProducts();
    }
  }, [slug]);

  const fetchBrandAndProducts = async () => {
    try {
      // Fetch brand
      const { data: brandData, error: brandError } = await supabase
        .from('brands')
        .select('*')
        .eq('slug', slug)
        .single();

      if (brandError) throw brandError;
      setBrand(brandData);

      // Fetch products for this brand
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          vendor:vendors(business_name, whatsapp_number),
          category:categories(name),
          brand:brands(name)
        `)
        .eq('brand_id', brandData.id)
        .eq('status', 'active');

      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching brand data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBrandInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-16 text-center">
          <Store className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Brand Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The brand you're looking for doesn't exist.
          </p>
          <Button asChild>
            <Link to="/brands">Browse All Brands</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/brands">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Brands
            </Link>
          </Button>
          
          {/* Brand Header */}
          <div className="flex items-center space-x-6 mb-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={brand.logo_url || ''} alt={brand.name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                {getBrandInitials(brand.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold mb-2">{brand.name}</h1>
              {brand.description && (
                <p className="text-muted-foreground text-lg">{brand.description}</p>
              )}
            </div>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No Products Found</h2>
            <p className="text-muted-foreground mb-8">
              This brand doesn't have any products available at the moment.
            </p>
            <Button asChild>
              <Link to="/brands">Browse All Brands</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                {products.length} product{products.length !== 1 ? 's' : ''} found
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}