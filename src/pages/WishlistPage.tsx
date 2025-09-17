import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  slug: string;
  price_naira: number;
  images: string[];
  vendor?: {
    business_name: string;
    whatsapp_number: string;
    slug: string;
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

export default function WishlistPage() {
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlistProducts();
  }, []);

  // Listen for storage changes to update wishlist in real-time
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "runmp:favorites:v1") {
        fetchWishlistProducts();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const fetchWishlistProducts = async () => {
    setLoading(true);
    try {
      const wishlist = JSON.parse(localStorage.getItem("runmp:favorites:v1") || "[]");
      
      if (wishlist.length === 0) {
        setWishlistProducts([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          vendor:vendors(*),
          category:categories(*),
          brand:brands(*)
        `)
        .in('id', wishlist)
        .eq('status', 'active');

      if (error) throw error;

      // Filter out products that may have been deleted
      const validProducts = data || [];
      const validProductIds = validProducts.map(p => p.id);
      const filteredWishlist = wishlist.filter((id: string) => validProductIds.includes(id));
      
      // Update localStorage to remove any invalid products
      if (filteredWishlist.length !== wishlist.length) {
        localStorage.setItem("runmp:favorites:v1", JSON.stringify(filteredWishlist));
      }

      setWishlistProducts(validProducts);
    } catch (error) {
      console.error('Error fetching wishlist products:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearWishlist = () => {
    localStorage.removeItem("runmp:favorites:v1");
    setWishlistProducts([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Wishlist</h1>
            <p className="text-muted-foreground">
              {wishlistProducts.length} {wishlistProducts.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>
          
          {wishlistProducts.length > 0 && (
            <Button variant="outline" onClick={clearWishlist}>
              Clear Wishlist
            </Button>
          )}
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
        ) : wishlistProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlistProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
              <Heart className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Save products you like to your wishlist by clicking the heart icon. 
              You can review them anytime and order when you're ready.
            </p>
            <Link to="/products">
              <Button>
                <ShoppingBag className="w-4 h-4 mr-2" />
                Start Shopping
              </Button>
            </Link>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}