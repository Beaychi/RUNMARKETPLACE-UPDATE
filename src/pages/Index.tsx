import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { ProductCard } from "@/components/product/ProductCard";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  slug: string;
  price_naira: number;
  images: string[];
  featured?: boolean;
  vendor?: {
    business_name: string;
    whatsapp_number: string;
  };
  category?: {
    name: string;
    slug: string;
  };
  brand?: {
    name: string;
    slug: string;
  };
}

const Index = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // First try to fetch featured products
        const { data: featuredData, error: featuredError } = await supabase
          .from('products')
          .select(`
            *,
            vendor:vendors(business_name, whatsapp_number),
            category:categories(name, slug),
            brand:brands(name, slug)
          `)
          .eq('status', 'active')
          .eq('featured', true)
          .limit(8);

        if (featuredError) throw featuredError;
        
        // If no featured products, fetch latest products
        if (!featuredData?.length) {
          const { data: recentData, error: recentError } = await supabase
            .from('products')
            .select(`
              *,
              vendor:vendors(business_name, whatsapp_number),
              category:categories(name, slug),
              brand:brands(name, slug)
            `)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(8);
            
          if (recentError) throw recentError;
          setFeaturedProducts(recentData || []);
        } else {
          setFeaturedProducts(featuredData);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setFeaturedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main>
        <HeroSection />
        <CategoryGrid />
        
        {/* Featured Products */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                {featuredProducts.some(p => p.featured) ? 'Featured Products' : 'Latest Products'}
              </h2>
              <p className="text-muted-foreground">
                {featuredProducts.some(p => p.featured) ? 'Handpicked products from our trusted vendors' : 'Newest arrivals from our marketplace'}
              </p>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square bg-muted rounded-lg mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                      <div className="h-6 bg-muted rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : featuredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product as any} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No products available at the moment. Be the first to add one!</p>
              </div>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;