import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, Eye, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { normalizeWhatsAppNumber } from "@/lib/utils";

export interface Product {
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

export interface ProductCardProps {
  product: Product;
  showVendor?: boolean;
}

export function ProductCard({ product, showVendor = true }: ProductCardProps) {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if product is in wishlist (localStorage)
    const wishlist = JSON.parse(localStorage.getItem("runmp:favorites:v1") || "[]");
    setIsInWishlist(wishlist.includes(product.id));
  }, [product.id]);

  const toggleWishlist = () => {
    const wishlist = JSON.parse(localStorage.getItem("runmp:favorites:v1") || "[]");
    let newWishlist;

    if (isInWishlist) {
      newWishlist = wishlist.filter((id: string) => id !== product.id);
      toast({
        title: "Removed from wishlist",
        description: `${product.name} has been removed from your wishlist.`
      });
    } else {
      newWishlist = [...wishlist, product.id];
      toast({
        title: "Added to wishlist",
        description: `${product.name} has been added to your wishlist.`
      });
    }

    localStorage.setItem("runmp:favorites:v1", JSON.stringify(newWishlist));
    setIsInWishlist(!isInWishlist);
  };

  const handleWhatsAppOrder = async () => {
    if (!product.vendor?.whatsapp_number) return;

    const productUrl = `${window.location.origin}/#/product/${product.slug}`;
    const message = `Hello, I'm interested in ${product.name} from Run Marketplace (${productUrl}). Is it available?`;
    const normalized = normalizeWhatsAppNumber(product.vendor.whatsapp_number);
    if (!normalized) return;
    const whatsappUrl = `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const imageUrl = product.images?.[0] || "/placeholder.svg";

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="relative">
        <Link to={`/product/${product.slug}`}>
          <div className="aspect-square overflow-hidden">
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        </Link>
        
        {/* Wishlist Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-background/80 hover:bg-background"
          onClick={toggleWishlist}
        >
          <Heart 
            className={`w-4 h-4 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
          />
        </Button>

        {/* Quick Actions */}
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex flex-col space-y-1">
            <Link to={`/product/${product.slug}`}>
              <Button variant="ghost" size="icon" className="bg-background/80 hover:bg-background">
                <Eye className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-2">
          {/* Category and Brand */}
          <div className="flex items-center space-x-2 text-sm">
            {product.category && (
              <Badge variant="outline" className="text-xs">
                {product.category.name}
              </Badge>
            )}
            {product.brand && (
              <Badge variant="secondary" className="text-xs">
                {product.brand.name}
              </Badge>
            )}
          </div>

          {/* Product Name */}
          <Link to={`/product/${product.slug}`}>
            <h3 className="font-semibold text-sm leading-tight hover:text-primary transition-colors line-clamp-2">
              {product.name}
            </h3>
          </Link>

          {/* Vendor Info */}
          {showVendor && product.vendor && (
            <Link to={`/brand/${product.vendor.slug}`}>
              <p className="text-xs text-muted-foreground hover:text-primary transition-colors">
                by {product.vendor.business_name}
              </p>
            </Link>
          )}

          {/* Price */}
          <p className="font-bold text-lg text-primary">
            {formatPrice(product.price_naira)}
          </p>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full" 
          onClick={handleWhatsAppOrder}
          disabled={!product.vendor?.whatsapp_number}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Order on WhatsApp
        </Button>
      </CardFooter>
    </Card>
  );
}