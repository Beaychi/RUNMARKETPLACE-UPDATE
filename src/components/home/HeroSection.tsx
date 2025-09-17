import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingBag } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-primary/5 to-accent/5 py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Text */}
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            Discover Amazing Products from 
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {" "}Trusted Vendors
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Shop from hundreds of verified sellers across Nigeria. Quality products, 
            competitive prices, and direct communication with vendors via WhatsApp.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/products">
              <Button size="lg" className="w-full sm:w-auto">
                <ShoppingBag className="w-5 h-5 mr-2" />
                Start Shopping
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            
            <Link to="/brands">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Explore Brands
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-16 pt-8 border-t border-border/50">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-primary">500+</h3>
              <p className="text-muted-foreground">Trusted Vendors</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-primary">10K+</h3>
              <p className="text-muted-foreground">Quality Products</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-primary">50K+</h3>
              <p className="text-muted-foreground">Happy Customers</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl"></div>
      </div>
    </section>
  );
}