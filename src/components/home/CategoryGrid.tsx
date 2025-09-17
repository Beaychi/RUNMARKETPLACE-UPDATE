import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

import type { Database } from "@/integrations/supabase/types";

type Category = Database['public']['Tables']['categories']['Row'];

export function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');

        if (error) throw error;
        setCategories(data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const getCategoryIcon = (categoryName: string) => {
    const icons: Record<string, string> = {
      "Men's Fashion": "👔",
      "Women's Fashion": "👗", 
      "Electronics": "📱",
      "Phone Gadgets": "🔌",
      "Beauty & Health": "💄",
      "Accessories": "👜",
      "Food & Groceries": "🛒",
      "Home & Living": "🏠",
      "Sports & Fitness": "⚽",
      "Books & Education": "📚"
    };
    return icons[categoryName] || "🛍️";
  };

  if (loading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Shop by Category</h2>
            <p className="text-muted-foreground">Find exactly what you're looking for</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-muted rounded-full mx-auto mb-4"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mx-auto"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Shop by Category</h2>
          <p className="text-muted-foreground">Find exactly what you're looking for</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {categories.map((category) => (
            <Link key={category.id} to={`/category/${category.slug}`}>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">{getCategoryIcon(category.name)}</div>
                  <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link to="/products">
            <button className="text-primary hover:underline font-medium">
              View All Categories →
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}