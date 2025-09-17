import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Eye, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "@/hooks/useAuthState";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  slug: string;
  price_naira: number;
  images: string[];
  vendor_id: string;
  rating?: number;
  description?: string;
  vendor?: {
    business_name: string;
    whatsapp_number: string;
  };
  categories?: {
    name: string;
  };
  brands?: {
    name: string;
  };
}

interface ProductCardProps {
  product: Product;
  showVendor?: boolean;
  className?: string;
}

export const ProductCard = ({ product, showVendor = true, className = "" }: ProductCardProps) => {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const { user } = useAuthState();
  const { toast } = useToast();

  useEffect(() => {
    checkWishlistStatus();
  }, [user, product.id]);

  const checkWishlistStatus = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .single();
      
      setIsInWishlist(!!data);
    } catch (error) {
      // Item not in wishlist
      setIsInWishlist(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleWhatsAppOrder = async () => {
    const productUrl = `${window.location.origin}/product/${product.slug}`;
    const description = product.description ? `\nDescription: ${product.description}` : '';
    const category = product.categories?.name ? `\nCategory: ${product.categories.name}` : '';
    const brand = product.brands?.name ? `\nBrand: ${product.brands.name}` : '';
    
    const message = `Hello! I'm interested in ordering this product from Run Marketplace:

📱 Product: ${product.name}
💰 Price: ₦${product.price_naira.toLocaleString()}${category}${brand}${description}

🔗 Product Link: ${productUrl}

Is this product available for purchase?`;
    
    // Track order click analytics
    try {
      await supabase
        .from('analytics')
        .insert({
          vendor_id: product.vendor_id,
          product_id: product.id,
          event_type: 'order_click'
        });
    } catch (error) {
      console.error('Error tracking order click:', error);
    }
    
    const whatsappUrl = `https://wa.me/${product.vendor?.whatsapp_number}?text=${encodeURIComponent(message)}`;
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

  const imageUrl = product.images?.[0] || 'https://via.placeholder.com/300x300?text=No+Image';

  const renderStars = (rating: number = 0) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating ? 'fill-primary text-primary' : 'text-muted-foreground/30'
            }`}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">({rating.toFixed(1)})</span>
      </div>
    );
  };

  return (
    <Card className={`group hover:shadow-md transition-all duration-300 ${className} max-w-xs`}>
      <CardContent className="p-0">
        <div className="relative aspect-square overflow-hidden rounded-t-lg bg-muted">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://via.placeholder.com/200x200?text=No+Image';
            }}
          />
          
          {/* Wishlist Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 bg-background/80 hover:bg-background h-7 w-7"
            onClick={toggleWishlist}
            disabled={isWishlistLoading}
          >
            <Heart 
              className={`h-3 w-3 ${
                isInWishlist ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
              }`} 
            />
          </Button>

          {/* Quick View Button */}
          <Link 
            to={`/product/${product.slug}`}
            onClick={async () => {
                // Track product view analytics
                try {
                  console.log('Tracking product view for:', product.name, 'vendor:', product.vendor_id);
                  await supabase
                    .from('analytics')
                    .insert({
                      vendor_id: product.vendor_id,
                      product_id: product.id,
                      event_type: 'view'
                    });
                  console.log('Product view tracked successfully');
                } catch (error) {
                  console.error('Error tracking product view:', error);
                }
              }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 left-1 bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
            >
              <Eye className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        <div className="p-2">
          <div className="space-y-1">
            {/* Category and Brand */}
            <div className="flex items-center gap-1 flex-wrap">
              {product.categories && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                  {product.categories.name}
                </Badge>
              )}
              {product.brands && (
                <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                  {product.brands.name}
                </Badge>
              )}
            </div>

            {/* Product Name */}
            <Link 
              to={`/product/${product.slug}`}
              onClick={async () => {
                // Track product view analytics
                try {
                  await supabase
                    .from('analytics')
                    .insert({
                      vendor_id: product.vendor_id,
                      product_id: product.id,
                      event_type: 'view'
                    });
                } catch (error) {
                  console.error('Error tracking product view:', error);
                }
              }}
            >
              <h3 className="font-medium text-sm text-foreground hover:text-primary transition-colors line-clamp-2 leading-tight">
                {product.name}
              </h3>
            </Link>

            {/* Rating */}
            {renderStars(product.rating || 4.5)}

            {/* Vendor Info */}
            {showVendor && product.vendor && (
              <p className="text-xs text-muted-foreground truncate">
                by {product.vendor.business_name}
              </p>
            )}

            {/* Price */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-semibold text-foreground">
                {formatPrice(product.price_naira)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-2 pt-0">
        <Button 
          onClick={handleWhatsAppOrder} 
          className="w-full h-7 text-xs"
          size="sm"
        >
          <MessageCircle className="h-3 w-3 mr-1" />
          Order on WhatsApp
        </Button>
      </CardFooter>
    </Card>
  );
};