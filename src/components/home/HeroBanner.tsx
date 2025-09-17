import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, ShoppingBag, Users, Zap } from "lucide-react";

export const HeroBanner = () => {
  return (
    <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                Nigeria's Premier{" "}
                <span className="text-primary">Marketplace</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Discover thousands of quality products from trusted local vendors. 
                Shop with confidence and connect directly via WhatsApp.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="text-lg px-8">
                <Link to="/products">
                  <Search className="h-5 w-5 mr-2" />
                  Explore Products
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8">
                <Link to="/brands">
                  <Users className="h-5 w-5 mr-2" />
                  Browse Vendors
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-primary">1000+</div>
                <div className="text-sm text-muted-foreground">Products</div>
              </div>
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-primary">50+</div>
                <div className="text-sm text-muted-foreground">Vendors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-primary">10K+</div>
                <div className="text-sm text-muted-foreground">Happy Customers</div>
              </div>
            </div>
          </div>

          {/* Visual Elements */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              {/* Feature Cards */}
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                  <ShoppingBag className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">Quality Products</h3>
                  <p className="text-sm text-muted-foreground">
                    Curated selection from trusted vendors
                  </p>
                </div>
                <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                  <Zap className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">Fast Ordering</h3>
                  <p className="text-sm text-muted-foreground">
                    Direct WhatsApp ordering with vendors
                  </p>
                </div>
              </div>
              <div className="mt-8 space-y-4">
                <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                  <Users className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">Local Vendors</h3>
                  <p className="text-sm text-muted-foreground">
                    Support Nigerian businesses
                  </p>
                </div>
                <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                  <Search className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">Easy Discovery</h3>
                  <p className="text-sm text-muted-foreground">
                    Advanced search and filtering
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};