import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Store, MapPin, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  _count?: {
    products: number;
  };
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState("");

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    filterBrands();
  }, [brands, searchQuery, selectedLetter]);

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name');

      if (error) throw error;

      // Get product counts for each brand
      const brandsWithCounts = await Promise.all(
        (data || []).map(async (brand) => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('brand_id', brand.id)
            .eq('status', 'active');

          return {
            ...brand,
            _count: { products: count || 0 }
          };
        })
      );

      setBrands(brandsWithCounts);
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBrands = () => {
    let filtered = brands;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(brand =>
        brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        brand.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply letter filter
    if (selectedLetter) {
      filtered = filtered.filter(brand =>
        brand.name.charAt(0).toLowerCase() === selectedLetter.toLowerCase()
      );
    }

    setFilteredBrands(filtered);
  };

  const generateAlphabetButtons = () => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    return alphabet.map(letter => {
      const hasBrands = brands.some(brand => 
        brand.name.charAt(0).toLowerCase() === letter.toLowerCase()
      );
      
      return (
        <Button
          key={letter}
          variant={selectedLetter === letter ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedLetter(selectedLetter === letter ? "" : letter)}
          disabled={!hasBrands}
          className="w-10 h-10 p-0"
        >
          {letter}
        </Button>
      );
    });
  };

  const getBrandInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Our Trusted Brands</h1>
          <p className="text-muted-foreground mb-6">
            Discover amazing products from verified vendors across Nigeria
          </p>

          {/* Search */}
          <div className="relative max-w-md mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="search"
              placeholder="Search brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Alphabet Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={selectedLetter === "" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedLetter("")}
            >
              All
            </Button>
            {generateAlphabetButtons()}
          </div>

          {/* Results Count */}
          <p className="text-sm text-muted-foreground mb-6">
            {loading ? "Loading..." : `${filteredBrands.length} ${filteredBrands.length === 1 ? 'brand' : 'brands'} found`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-muted rounded-full"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded w-full"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredBrands.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBrands.map((brand) => (
              <Link key={brand.id} to={`/brand/${brand.slug}`}>
                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={brand.logo_url || ''} alt={brand.name} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                          {getBrandInitials(brand.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
                          {brand.name}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <Badge variant="secondary" className="flex items-center space-x-1">
                            <Store className="w-3 h-3" />
                            <span>{brand._count?.products || 0} products</span>
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {brand.description && (
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {brand.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
              <Store className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">No brands found</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchQuery || selectedLetter
                ? "Try adjusting your search or filter criteria"
                : "No brands are available at the moment"}
            </p>
            {(searchQuery || selectedLetter) && (
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedLetter("");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}