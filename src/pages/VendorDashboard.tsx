import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import SocialMediaSection from "@/components/vendor/SocialMediaSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  Plus, 
  Settings, 
  BarChart3, 
  Eye, 
  MessageCircle, 
  ShoppingCart,
  Upload,
  Trash2,
  Edit
} from "lucide-react";

interface Profile {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  business_name?: string;
  business_image_url?: string;
  brand_description?: string;
  encrypted_phone?: string;
  phone?: string;
  vendor_approved: boolean;
  email_verified: boolean;
}

interface Product {
  id: string;
  name: string;
  price_naira: number;
  images: string[];
  status: string;
  manual_purchases: number;
  created_at: string;
  stock_quantity: number;
}

interface Analytics {
  product_views: number;
  order_clicks: number;
  manual_purchases: number;
}

export default function VendorDashboard() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({ product_views: 0, order_clicks: 0, manual_purchases: 0 });
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Get user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (!profileData || profileData.role !== 'vendor') {
        toast({
          title: "Access Denied",
          description: "You must be a vendor to access this page.",
          variant: "destructive"
        });
        navigate("/");
        return;
      }

      if (!profileData.email_verified) {
        toast({
          title: "Email Verification Required",
          description: "Please verify your email before accessing the vendor dashboard.",
          variant: "destructive"
        });
        navigate("/");
        return;
      }

      if (!profileData.vendor_approved) {
        toast({
          title: "Vendor Approval Pending",
          description: "Your vendor account is pending approval. Please wait for admin approval.",
          variant: "destructive"
        });
      }

      setProfile(profileData);

      // Get or create vendor data
      let { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      // If no vendor record exists, create one
      if (!vendorData) {
        const slug = profile?.business_name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `vendor-${session.user.id.slice(0, 8)}`;
        
        const { data: newVendor, error: createError } = await supabase
          .from('vendors')
          .insert({
            user_id: session.user.id,
            business_name: profile?.business_name || 'My Business',
            description: profile?.brand_description || 'A great business',
            whatsapp_number: profile?.phone || '000000000',
            slug: slug,
            status: 'approved'
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating vendor:', createError);
          throw new Error('Failed to create vendor profile');
        }
        vendorData = newVendor;
      }

      const vendorId = vendorData?.id;

      // Load vendor products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      setProducts(productsData || []);

      // Load categories only
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      setCategories(categoriesData || []);

      // Load analytics
      const { data: analyticsData } = await supabase
        .from('analytics')
        .select('event_type')
        .eq('vendor_id', vendorId);

      if (analyticsData) {
        const stats = {
          product_views: analyticsData.filter(a => a.event_type === 'view').length,
          order_clicks: analyticsData.filter(a => a.event_type === 'order_click').length,
          manual_purchases: analyticsData.filter(a => a.event_type === 'manual_purchase').length,
        };
        setAnalytics(stats);
      }

    } catch (error) {
      console.error('Error loading vendor data:', error);
      toast({
        title: "Error",
        description: "Failed to load vendor dashboard data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const imageFile = formData.get('image') as File;
    
    try {
      // Get or create the vendor record for the current user
      let { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', profile?.user_id)
        .maybeSingle();

      if (!vendorData) {
        throw new Error('Vendor profile not found. Please complete your vendor registration by contacting support.');
      }

      let imageUrl = '/placeholder.svg';
      
      // Upload image if provided
      if (imageFile && imageFile.size > 0) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

      // Get the brand ID from vendor's business name and logo
      const { data: brandData, error: brandError } = await supabase
        .rpc('get_or_create_brand_from_business_name', { 
          business_name_param: profile?.business_name,
          logo_url_param: profile?.business_image_url
        });

      if (brandError) {
        console.error('Error creating/getting brand:', brandError);
        throw new Error('Failed to create brand from business name');
      }

      const { error } = await supabase
        .from('products')
        .insert({
          name: formData.get('name') as string,
          description: formData.get('description') as string,
          price_naira: parseInt(formData.get('price') as string),
          category_id: formData.get('category') as string,
          brand_id: brandData,
          images: [imageUrl],
          vendor_id: vendorData.id,
          slug: `${formData.get('name')}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Product Added",
        description: "Your product has been added successfully."
      });

      // Reset form
      e.currentTarget.reset();
      checkAuthAndLoadData(); // Reload data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const markAsSold = async (productId: string) => {
    try {
      // Get vendor ID first
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', profile?.user_id)
        .single();

      const { error } = await supabase
        .from('products')
        .update({ 
          manual_purchases: (products.find(p => p.id === productId)?.manual_purchases || 0) + 1 
        })
        .eq('id', productId);

      if (error) throw error;

      // Add analytics entry
      try {
        await supabase
          .from('analytics')
          .insert({
            product_id: productId,
            vendor_id: vendorData?.id,
            event_type: 'manual_purchase'
          });
      } catch (analyticsError) {
        console.error('Error tracking manual purchase:', analyticsError);
      }

      toast({
        title: "Sale Confirmed",
        description: "Product marked as sold successfully."
      });

      checkAuthAndLoadData(); // Reload data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Product Deleted",
        description: "Product has been permanently deleted."
      });

      checkAuthAndLoadData(); // Reload data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const archiveProduct = async (productId: string) => {
    try {
      const product = products.find(p => p.id === productId) as any;
      const { error } = await supabase
        .from('products')
        .update({ is_archived: !product?.is_archived })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: product?.is_archived ? "Product Unarchived" : "Product Archived",
        description: product?.is_archived ? "Product is now visible to customers." : "Product is now hidden from customers."
      });

      checkAuthAndLoadData(); // Reload data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateStockStatus = async (productId: string, outOfStock: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          status: outOfStock ? 'out_of_stock' : 'active',
          stock_quantity: outOfStock ? 0 : 1 
        })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: outOfStock ? "Marked Out of Stock" : "Back in Stock",
        description: outOfStock ? "Product is now marked as out of stock." : "Product is now available for purchase."
      });

      checkAuthAndLoadData(); // Reload data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateStockQuantity = async (productId: string, quantity: number) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          stock_quantity: quantity,
          status: quantity > 0 ? 'active' : 'out_of_stock'
        })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Stock Updated",
        description: `Stock quantity updated to ${quantity}.`
      });

      checkAuthAndLoadData(); // Reload data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleBrandLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    try {
      // Upload image to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `brand-logo-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      // Update profile with new business image
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ business_image_url: publicUrl })
        .eq('user_id', profile.user_id);

      if (updateError) throw updateError;

      // Update brand logo if brand exists
      if (profile.business_name) {
        await supabase.rpc('get_or_create_brand_from_business_name', {
          business_name_param: profile.business_name,
          logo_url_param: publicUrl
        });
      }

      toast({
        title: "Brand Logo Updated",
        description: "Your brand logo has been updated successfully."
      });

      checkAuthAndLoadData(); // Reload data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading vendor dashboard...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertDescription>
              Unable to load vendor profile. Please try again.
            </AlertDescription>
          </Alert>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Vendor Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile.business_name || profile.full_name}
          </p>
          {!profile.vendor_approved && (
            <Alert className="mt-4">
              <AlertDescription>
                Your vendor account is pending approval. Some features may be limited.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="add-product" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Product
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Product Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.product_views}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Order Clicks</CardTitle>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.order_clicks}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Confirmed Sales</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.manual_purchases}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Products</CardTitle>
                <CardDescription>Your latest product listings</CardDescription>
              </CardHeader>
              <CardContent>
                {products.length > 0 ? (
                  <div className="space-y-4">
                    {products.slice(0, 5).map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <img 
                            src={product.images[0] || '/placeholder.svg'} 
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div>
                            <h4 className="font-medium">{product.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              ₦{product.price_naira.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                            {product.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {product.manual_purchases} sales
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No products yet. Add your first product to get started!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>My Products</CardTitle>
                <CardDescription>Manage your product listings</CardDescription>
              </CardHeader>
              <CardContent>
                {products.length > 0 ? (
                  <div className="space-y-4">
                    {products.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <img 
                            src={product.images[0] || '/placeholder.svg'} 
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div>
                            <h4 className="font-medium">{product.name}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              ₦{product.price_naira.toLocaleString()}
                            </p>
                            <div className="flex items-center space-x-2">
                              <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                                {product.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {product.manual_purchases} confirmed sales
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm" 
                            variant={product.status === 'inactive' ? "default" : "secondary"}
                            onClick={() => updateStockStatus(product.id, product.status !== 'inactive')}
                            disabled={!profile.vendor_approved}
                          >
                            {product.status === 'inactive' ? 'Mark In Stock' : 'Mark Sold Out'}
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => markAsSold(product.id)}
                            disabled={!profile.vendor_approved}
                          >
                            Mark as Sold
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
                                deleteProduct(product.id);
                              }
                            }}
                            disabled={!profile.vendor_approved}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No products yet. Add your first product to get started!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add-product">
            <Card>
              <CardHeader>
                <CardTitle>Add New Product</CardTitle>
                <CardDescription>List a new product for sale</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input id="name" name="name" required />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₦)</Label>
                    <Input id="price" name="price" type="number" required />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select name="category">
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="image">Product Image</Label>
                    <Input 
                      id="image" 
                      name="image" 
                      type="file" 
                      accept="image/*"
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                    <p className="text-xs text-muted-foreground">Upload a product image (JPG, PNG, etc.)</p>
                  </div>
                  
                  <Button type="submit" disabled={!profile.vendor_approved}>
                    Add Product
                  </Button>
                  
                  {!profile.vendor_approved && (
                    <p className="text-sm text-muted-foreground">
                      Your account must be approved before you can add products.
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Vendor Profile</CardTitle>
                  <CardDescription>View your business information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="mb-6">
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={profile.business_image_url || ''} />
                        <AvatarFallback className="text-2xl">
                          {profile.business_name?.slice(0, 2).toUpperCase() || profile.full_name?.slice(0, 2).toUpperCase() || 'V'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold">{profile.business_name || 'Your Business'}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{profile.brand_description}</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => document.getElementById('brand-logo-input')?.click()}
                        >
                          Upload Brand Logo
                        </Button>
                        <input
                          id="brand-logo-input"
                          type="file"
                          accept="image/*"
                          onChange={handleBrandLogoUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Full Name</Label>
                      <Input value={profile.full_name} disabled />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input value={profile.email} disabled />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Business Name</Label>
                    <Input value={profile.business_name || ''} disabled />
                  </div>
                  
                  <div>
                    <Label>Brand Description</Label>
                    <Textarea value={profile.brand_description || ''} disabled />
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Badge variant={profile.email_verified ? 'default' : 'destructive'}>
                      Email: {profile.email_verified ? 'Verified' : 'Not Verified'}
                    </Badge>
                    <Badge variant={profile.vendor_approved ? 'default' : 'secondary'}>
                      Vendor: {profile.vendor_approved ? 'Approved' : 'Pending'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <SocialMediaSection vendorId={profile?.user_id} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
}