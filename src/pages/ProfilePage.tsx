import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Settings, Package, Heart } from "lucide-react";

interface Profile {
  full_name: string;
  email: string;
  phone: string;
  matric_number: string;
  business_name: string;
  role: string;
  avatar_url: string;
  business_image_url: string;
  brand_description: string;
  vendor_approved: boolean;
  email_verified: boolean;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUserAndLoadProfile();
  }, []);

  const checkUserAndLoadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(profileData);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUpdating(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const updates = {
      full_name: formData.get("fullName") as string,
      phone: formData.get("phone") as string,
      business_name: formData.get("businessName") as string,
      brand_description: formData.get("brandDescription") as string,
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', session.user.id);

      if (profileError) throw profileError;

      // If this is a vendor, also update the vendors table with phone and business name
      if (profile?.role === 'vendor') {
        const vendorUpdates: any = {};
        
        if (updates.phone) {
          vendorUpdates.whatsapp_number = updates.phone;
        }
        
        if (updates.business_name) {
          vendorUpdates.business_name = updates.business_name;
        }

        if (Object.keys(vendorUpdates).length > 0) {
          const { error: vendorError } = await supabase
            .from('vendors')
            .update(vendorUpdates)
            .eq('user_id', session.user.id);

          if (vendorError) throw vendorError;
        }
      }

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      toast({
        title: "Profile updated successfully!",
        description: "Your changes have been saved.",
      });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <Alert variant="destructive">
              <AlertDescription>{error || "Profile not found"}</AlertDescription>
            </Alert>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">My Profile</h1>
            <div className="flex items-center space-x-2">
              <Badge variant={profile.role === 'vendor' ? 'default' : 'secondary'}>
                {profile.role}
              </Badge>
              {profile.role === 'vendor' && (
                <Badge variant={profile.vendor_approved ? 'default' : 'destructive'}>
                  {profile.vendor_approved ? 'Approved' : 'Pending Approval'}
                </Badge>
              )}
            </div>
          </div>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </TabsTrigger>
              <TabsTrigger value="wishlist" className="flex items-center space-x-2">
                <Heart className="w-4 h-4" />
                <span>Wishlist</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your profile information and business details
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdateProfile}>
                  <CardContent className="space-y-6">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          defaultValue={profile.full_name}
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          value={profile.email}
                          disabled
                          className="bg-muted"
                        />
                      </div>

                     <div className="space-y-2">
                        <Label htmlFor="matricNumber">Matriculation Number</Label>
                        <Input
                          id="matricNumber"
                          value={profile.matric_number || 'Not provided'}
                          disabled
                          className="bg-muted"
                        />
                      </div>

                       <div className="space-y-2">
                         <Label htmlFor="phone">Phone/WhatsApp Number</Label>
                         <Input
                           id="phone"
                           name="phone"
                           defaultValue={profile.phone}
                           placeholder="Enter your phone/WhatsApp number"
                         />
                         <p className="text-xs text-muted-foreground">
                           This number will be used for customer orders via WhatsApp
                         </p>
                       </div>
                    </div>

                    {profile.role === 'vendor' && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold">Business Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="businessName">Business Name</Label>
                            <Input
                              id="businessName"
                              name="businessName"
                              defaultValue={profile.business_name}
                              placeholder="Enter your business name"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="brandDescription">Brand Description</Label>
                          <Input
                            id="brandDescription"
                            name="brandDescription"
                            defaultValue={profile.brand_description}
                            placeholder="Describe your brand and what you sell"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button type="submit" disabled={updating}>
                        {updating ? "Updating..." : "Update Profile"}
                      </Button>
                    </div>
                  </CardContent>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="wishlist">
              <Card>
                <CardHeader>
                  <CardTitle>My Wishlist</CardTitle>
                  <CardDescription>
                    Products you've saved for later
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Your wishlist is empty</p>
                    <p className="text-sm">Start adding products to see them here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Manage your account preferences and security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Email Verification</h4>
                      <p className="text-sm text-muted-foreground">
                        {profile.email_verified ? "Your email is verified" : "Please verify your email"}
                      </p>
                    </div>
                    <Badge variant={profile.email_verified ? "default" : "destructive"}>
                      {profile.email_verified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Account Verification</h4>
                      <p className="text-sm text-muted-foreground">
                        Contact admin to verify your account
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toast({
                        title: "Verification Request Sent",
                        description: "An admin will review your account shortly."
                      })}
                    >
                      Request Verification
                    </Button>
                  </div>

                  {profile.role === 'vendor' && (
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Vendor Dashboard</h4>
                        <p className="text-sm text-muted-foreground">
                          Manage your products and business
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => navigate("/vendor-dashboard")}
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Go to Dashboard
                      </Button>
                    </div>
                  )}

                  <div className="pt-6 border-t">
                    <Button variant="destructive" onClick={handleSignOut}>
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}