import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showVendorFields, setShowVendorFields] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is already logged in and redirect based on role
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Fetch user profile to determine role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        if (profile) {
          switch (profile.role) {
            case 'admin':
              navigate("/admin-dashboard");
              break;
            case 'vendor':
              navigate("/vendor-dashboard");
              break;
            default:
              navigate("/");
          }
        } else {
          navigate("/");
        }
      }
    };
    checkUser();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const matricNumber = formData.get("matricNumber") as string;
    const isVendor = formData.get("isVendor") === "on";
    const businessName = formData.get("businessName") as string;
    const phone = formData.get("phone") as string;

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
            matric_number: matricNumber,
            role: isVendor ? 'vendor' : 'customer',
            business_name: isVendor ? businessName : null,
            phone: isVendor ? phone : null,
          }
        }
      });

      if (error) throw error;

      // Create profile for customer users (vendors will use vendor portal)
      if (data.user && !isVendor) {
        // Wait a moment for the user session to be established
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            full_name: fullName,
            email: email,
            role: 'customer',
            matric_number: matricNumber,
            email_verified: false
          })
          .select();

        if (profileError) {
          console.error('Profile creation error:', profileError);
          setError(`Failed to create profile: ${profileError.message}`);
          setLoading(false);
          return;
        }

        console.log('Customer profile created successfully:', profileData);
      }

      toast({
        title: "Account created successfully!",
        description: isVendor 
          ? "Please use the Vendor Portal to complete your registration."
          : "A confirmation link has been sent to your email. Please verify to continue.",
      });

      // Redirect based on user role
      if (isVendor) {
        navigate("/vendor-auth");
      } else {
        navigate("/");
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Fetch user profile to determine role and redirect accordingly
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, vendor_approved')
          .eq('user_id', data.user.id)
          .maybeSingle();

        // Only allow customer login on main auth page
        if (profile?.role === 'vendor') {
          setError("Vendor accounts should use the Vendor Portal to sign in.");
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        if (profile?.role === 'admin') {
          setError("Admin accounts should use the Admin Portal to sign in.");
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });

        navigate("/");
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome to Run Marketplace</h1>
            <p className="text-muted-foreground">Sign in to your account or create a new one</p>
            
            <div className="mt-6 space-y-2">
              <p className="text-sm font-medium text-foreground">Different user type?</p>
              <div className="flex gap-2 justify-center">
                <Link 
                  to="/vendor-auth" 
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Vendor Login
                </Link>
                <span className="text-muted-foreground">•</span>
                <Link 
                  to="/admin-auth" 
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Admin Login
                </Link>
              </div>
            </div>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <Card>
                <CardHeader>
                  <CardTitle>Sign In</CardTitle>
                  <CardDescription>
                    Enter your email and password to access your account
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleSignIn}>
                  <CardContent className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        name="email"
                        type="email" 
                        placeholder="Enter your email"
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password" 
                        name="password"
                        type="password" 
                        placeholder="Enter your password"
                        required 
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loading}
                    >
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            
            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Sign up for a new account to start shopping
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleSignUp}>
                  <CardContent className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input 
                        id="fullName" 
                        name="fullName"
                        type="text" 
                        placeholder="Enter your full name"
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        name="email"
                        type="email" 
                        placeholder="Enter your email"
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password" 
                        name="password"
                        type="password" 
                        placeholder="Create a password (6+ characters)"
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input 
                        id="confirmPassword" 
                        name="confirmPassword"
                        type="password" 
                        placeholder="Confirm your password"
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="matricNumber">Matriculation Number</Label>
                      <Input 
                        id="matricNumber" 
                        name="matricNumber"
                        type="text" 
                        placeholder="Enter your matriculation number"
                        required 
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isVendor"
                        name="isVendor"
                        className="rounded border-input"
                        onChange={(e) => setShowVendorFields(e.target.checked)}
                      />
                      <Label htmlFor="isVendor" className="text-sm font-normal">
                        Sign up as a vendor (seller)
                      </Label>
                    </div>
                    {showVendorFields && (
                      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                        <div className="space-y-2">
                          <Label htmlFor="businessName">Business Name</Label>
                          <Input 
                            id="businessName" 
                            name="businessName"
                            type="text" 
                            placeholder="Enter your business name"
                            required={showVendorFields}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone/WhatsApp Number</Label>
                          <Input 
                            id="phone" 
                            name="phone"
                            type="tel" 
                            placeholder="Enter your phone/WhatsApp number"
                            required={showVendorFields}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loading}
                    >
                      {loading ? "Creating account..." : "Sign Up"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}