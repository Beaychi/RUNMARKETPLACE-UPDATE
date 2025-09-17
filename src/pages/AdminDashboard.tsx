import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Package, 
  ShoppingBag, 
  BarChart3, 
  UserCheck, 
  UserX,
  Eye,
  MessageCircle,
  ShoppingCart
} from "lucide-react";

interface VendorProfile {
  user_id: string;
  full_name: string;
  email: string;
  business_name?: string;
  matric_number?: string;
  vendor_approved: boolean;
  email_verified: boolean;
  created_at: string;
  vendor_status?: string;
}

interface Analytics {
  total_users: number;
  total_vendors: number;
  total_products: number;
  total_views: number;
  total_order_clicks: number;
  total_purchases: number;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    total_users: 0,
    total_vendors: 0,
    total_products: 0,
    total_views: 0,
    total_order_clicks: 0,
    total_purchases: 0
  });
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

      // Check if user is admin
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();

      if (!profileData || profileData.role !== 'admin') {
        toast({
          title: "Access Denied",
          description: "You must be an admin to access this page.",
          variant: "destructive"
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);

      // Load vendor data with status from vendors table
      const { data: vendorProfiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'vendor')
        .order('created_at', { ascending: false });

      // Get vendor status for each profile
      const vendorsWithStatus = [];
      if (vendorProfiles) {
        for (const profile of vendorProfiles) {
          const { data: vendorData } = await supabase
            .from('vendors')
            .select('status')
            .eq('user_id', profile.user_id)
            .maybeSingle();
          
          vendorsWithStatus.push({
            ...profile,
            vendor_status: vendorData?.status || 'pending'
          });
        }
      }

      setVendors(vendorsWithStatus);

      // Load analytics
      const [usersRes, productsRes, analyticsRes] = await Promise.all([
        supabase.from('profiles').select('role').neq('role', 'admin'),
        supabase.from('products').select('id'),
        supabase.from('analytics').select('event_type')
      ]);

      const users = usersRes.data || [];
      const products = productsRes.data || [];
      const analyticsData = analyticsRes.data || [];

      setAnalytics({
        total_users: users.filter(u => u.role === 'customer').length,
        total_vendors: users.filter(u => u.role === 'vendor').length,
        total_products: products.length,
        total_views: analyticsData.filter(a => a.event_type === 'view').length,
        total_order_clicks: analyticsData.filter(a => a.event_type === 'order_click').length,
        total_purchases: analyticsData.filter(a => a.event_type === 'manual_purchase').length,
      });

    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin dashboard data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const approveVendor = async (userId: string) => {
    try {
      // Update both profiles and vendors table
      const [profileUpdate, vendorUpdate] = await Promise.all([
        supabase
          .from('profiles')
          .update({ vendor_approved: true })
          .eq('user_id', userId),
        supabase
          .from('vendors')
          .update({ status: 'approved' })
          .eq('user_id', userId)
      ]);

      if (profileUpdate.error) throw profileUpdate.error;
      if (vendorUpdate.error) throw vendorUpdate.error;

      toast({
        title: "Vendor Approved",
        description: "Vendor has been approved and can now list products."
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

  const suspendVendor = async (userId: string) => {
    try {
      // Update both profiles and vendors table
      const [profileUpdate, vendorUpdate] = await Promise.all([
        supabase
          .from('profiles')
          .update({ vendor_approved: false })
          .eq('user_id', userId),
        supabase
          .from('vendors')
          .update({ status: 'suspended' })
          .eq('user_id', userId)
      ]);

      if (profileUpdate.error) throw profileUpdate.error;
      if (vendorUpdate.error) throw vendorUpdate.error;

      toast({
        title: "Vendor Suspended",
        description: "Vendor has been suspended and cannot list new products.",
        variant: "destructive"
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

  const unsuspendVendor = async (userId: string) => {
    try {
      // Update both profiles and vendors table
      const [profileUpdate, vendorUpdate] = await Promise.all([
        supabase
          .from('profiles')
          .update({ vendor_approved: true })
          .eq('user_id', userId),
        supabase
          .from('vendors')
          .update({ status: 'approved' })
          .eq('user_id', userId)
      ]);

      if (profileUpdate.error) throw profileUpdate.error;
      if (vendorUpdate.error) throw vendorUpdate.error;

      toast({
        title: "Vendor Unsuspended",
        description: "Vendor has been reactivated and can now list products again."
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
          <div className="text-center">Loading admin dashboard...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertDescription>
              Access denied. Admin privileges required.
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
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage vendors, users, and platform analytics
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="vendors" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Vendors
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.total_users}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.total_vendors}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.total_products}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.total_views}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Order Clicks</CardTitle>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.total_order_clicks}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Confirmed Sales</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.total_purchases}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="vendors">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Management</CardTitle>
                <CardDescription>Approve, suspend, or manage vendor accounts</CardDescription>
              </CardHeader>
              <CardContent>
                {vendors.length > 0 ? (
                  <div className="space-y-4">
                    {vendors.map((vendor) => (
                      <div key={vendor.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <h4 className="font-medium">{vendor.business_name || vendor.full_name}</h4>
                          <p className="text-sm text-muted-foreground">{vendor.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Matric: {vendor.matric_number || 'Not provided'}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant={vendor.email_verified ? 'default' : 'destructive'}>
                              {vendor.email_verified ? 'Email Verified' : 'Email Not Verified'}
                            </Badge>
                            <Badge 
                              variant={
                                vendor.vendor_status === 'approved' ? 'default' : 
                                vendor.vendor_status === 'suspended' ? 'destructive' : 
                                'secondary'
                              }
                            >
                              {vendor.vendor_status === 'approved' ? 'Approved' : 
                               vendor.vendor_status === 'suspended' ? 'Suspended' : 
                               'Pending'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {vendor.vendor_status === 'approved' ? (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => suspendVendor(vendor.user_id)}
                            >
                              <UserX className="w-4 h-4 mr-1" />
                              Suspend
                            </Button>
                          ) : vendor.vendor_status === 'suspended' ? (
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => unsuspendVendor(vendor.user_id)}
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Unsuspend
                            </Button>
                          ) : (
                            <Button 
                              size="sm"
                              onClick={() => approveVendor(vendor.user_id)}
                              disabled={!vendor.email_verified}
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No vendors registered yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Metrics</CardTitle>
                  <CardDescription>Overall platform performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Users</span>
                    <span className="font-bold">{analytics.total_users}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Vendors</span>
                    <span className="font-bold">{analytics.total_vendors}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Products</span>
                    <span className="font-bold">{analytics.total_products}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Approved Vendors</span>
                    <span className="font-bold">
                      {vendors.filter(v => v.vendor_approved).length}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Engagement Metrics</CardTitle>
                  <CardDescription>User interaction statistics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Product Views</span>
                    <span className="font-bold">{analytics.total_views}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>WhatsApp Clicks</span>
                    <span className="font-bold">{analytics.total_order_clicks}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Confirmed Sales</span>
                    <span className="font-bold">{analytics.total_purchases}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Conversion Rate</span>
                    <span className="font-bold">
                      {analytics.total_order_clicks > 0 
                        ? ((analytics.total_purchases / analytics.total_order_clicks) * 100).toFixed(1)
                        : 0
                      }%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
}