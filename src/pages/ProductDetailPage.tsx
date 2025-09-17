import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard, type Product as CardProduct } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "@/hooks/useAuthState";
import { ArrowLeft, Heart, MessageCircle, Share2, Phone, MapPin } from "lucide-react";
import { normalizeWhatsAppNumber } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  slug: string;
  price_naira: number;
  images: string[];
  description?: string;
  status: string;
  vendor?: {
    id: string;
    business_name: string;
    whatsapp_number: string;
    slug: string;
    description?: string;
  };
  category?: {
    id: string;
    name: string;
  };
  brand?: {
    id: string;
    name: string;
  };
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthState();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<CardProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
    // fetchProduct depends only on slug via closure; safe to skip dep warning
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (product && user) {
      checkWishlistStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, user]);

  const checkWishlistStatus = async () => {
    if (!user || !product) return;
    
    try {
      const { data } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .single();
      
      setIsInWishlist(!!data);
    } catch (error) {
      setIsInWishlist(false);
    }
  };

  const fetchProduct = async () => {
    try {
      // Fetch the product details
      const { data: productData, error } = await supabase
        .from('products')
        .select(`
          *,
          vendor:vendors(id, business_name, whatsapp_number, slug, description),
          category:categories(*),
          brand:brands(*)
        `)
        .eq('slug', slug)
        .eq('status', 'active')
        .single();

      if (error) throw error;
      
      setProduct(productData);

      // Track product view
      if (productData?.vendor?.id) {
        try {
          await supabase
            .from('analytics')
            .insert({
              product_id: productData.id,
              vendor_id: productData.vendor.id,
              event_type: 'view'
            });
        } catch (error) {
          console.error('Error tracking product view:', error);
        }
      }

      // Fetch related products (same category, different product)
      if (productData?.category_id) {
        const { data: relatedData } = await supabase
          .from('products')
          .select(`
            *,
            vendor:vendors(id, business_name, whatsapp_number, slug, description),
            category:categories(*),
            brand:brands(*)
          `)
          .eq('category_id', productData.category_id)
          .neq('id', productData.id)
          .eq('status', 'active')
          .limit(5);

        setRelatedProducts(relatedData || []);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: "Error",
        description: "Failed to load product details.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppOrder = async () => {
    if (!product?.vendor) return;

    // Track order click
    try {
      await supabase
        .from('analytics')
        .insert({
          product_id: product.id,
          vendor_id: product.vendor.id,
          event_type: 'order_click'
        });
    } catch (error) {
      console.error('Error tracking order click:', error);
    }

    const message = `Hi! I'm interested in ordering *${product.name}*

Price: ₦${product.price_naira.toLocaleString()}
Product Link: ${window.location.origin}/#/product/${product.slug}
${product.description ? `\nDescription: ${product.description}` : ''}

Please let me know about availability and delivery options. Thank you!`;

    const normalized = normalizeWhatsAppNumber(product.vendor.whatsapp_number);
    if (!normalized) return;
    const whatsappUrl = `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const toggleWishlist = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add items to your wishlist",
        variant: "destructive",
      });
      return;
    }

    if (!product) return;

    setIsWishlistLoading(true);

    try {
      if (isInWishlist) {
        const { error } = await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product.id);

        if (error) throw error;
        setIsInWishlist(false);
        toast({
          title: "Removed from wishlist",
          description: "Item has been removed from your wishlist",
        });
      } else {
        const { error } = await supabase
          .from('wishlists')
          .insert({
            user_id: user.id,
            product_id: product.id,
          });

        if (error) throw error;
        setIsInWishlist(true);
        toast({
          title: "Added to wishlist",
          description: "Item has been added to your wishlist",
        });
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: product?.name,
      text: `Check out ${product?.name} for ₦${product?.price_naira.toLocaleString()} on Run Marketplace`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied!",
      description: "Product link has been copied to your clipboard",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading product details...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The product you're looking for doesn't exist or is no longer available.
            </p>
            <Button onClick={() => navigate('/products')}>
              Browse All Products
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm text-muted-foreground">
            {product.category?.name}
          </span>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium">{product.name}</span>
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
              <img
                src={product.images[0] || '/placeholder.svg'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <div className="flex items-center gap-2 mb-4">
                {product.category && (
                  <Badge variant="secondary">{product.category.name}</Badge>
                )}
                {product.brand && (
                  <Badge variant="outline">{product.brand.name}</Badge>
                )}
              </div>
              <div className="text-3xl font-bold text-primary mb-4">
                ₦{product.price_naira.toLocaleString()}
              </div>
            </div>

            {/* Vendor Info */}
            {product.vendor && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sold by</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-lg">{product.vendor.business_name}</p>
                      {product.vendor.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {product.vendor.description}
                        </p>
                      )}
                    </div>
                    
                    {product.vendor.whatsapp_number && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>WhatsApp: {product.vendor.whatsapp_number.startsWith('234') ? '+' + product.vendor.whatsapp_number : product.vendor.whatsapp_number}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Product Description */}
            {product.description && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{product.description}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                size="lg" 
                className="w-full flex items-center gap-2"
                onClick={handleWhatsAppOrder}
              >
                <MessageCircle className="w-5 h-5" />
                Order on WhatsApp
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={toggleWishlist}
                  disabled={isWishlistLoading}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                  {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard 
                  key={relatedProduct.id} 
                  product={relatedProduct}
                  showVendor={true}
                />
              ))}
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}