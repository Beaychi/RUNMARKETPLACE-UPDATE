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
import { ArrowLeft } from "lucide-react";

export default function VendorAuthPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (profile?.role === 'vendor') {
          navigate("/vendor-dashboard");
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
      // Encrypt phone number before storing
      const encryptedPhone = await supabase.rpc('encrypt_phone', { phone_text: phone });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/vendor-dashboard`,
          data: {
            full_name: fullName,
            matric_number: matricNumber,
            role: 'vendor',
            business_name: businessName,
            phone: phone,
            encrypted_phone: encryptedPhone.data,
          }
        }
      });

      if (error) throw error;

      // Create profile and vendor entries if user was created
      if (data.user) {
        // Wait a moment for the user session to be established
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Create profile with better error handling
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            full_name: fullName,
            email: email,
            role: 'vendor',
            matric_number: matricNumber,
            business_name: businessName,
            phone: phone,
            encrypted_phone: encryptedPhone.data,
            vendor_approved: false
          })
          .select();

        if (profileError) {
          console.error('Profile creation error:', profileError);
          setError(`Failed to create profile: ${profileError.message}`);
          setLoading(false);
          return;
        }

        console.log('Profile created successfully:', profileData);

        // Create vendor entry
        const vendorSlug = businessName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .insert({
            user_id: data.user.id,
            business_name: businessName,
            slug: vendorSlug,
            whatsapp_number: phone,
            encrypted_whatsapp: encryptedPhone.data,
            status: 'pending'
          })
          .select();

        if (vendorError) {
          console.error('Vendor creation error:', vendorError);
          setError(`Failed to create vendor record: ${vendorError.message}`);
          setLoading(false);
          return;
        }

        console.log('Vendor record created successfully:', vendorData);
      }

      toast({
        title: "Vendor account created successfully!",
        description: "A confirmation link has been sent to your email. Your account is pending approval.",
      });

      navigate("/auth");
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

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, vendor_approved')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (profile?.role !== 'vendor') {
          setError("This account is not registered as a vendor. Please use the correct login page.");
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        // Check if vendor is approved - allow login but show status
        if (!profile.vendor_approved) {
          toast({
            title: "Account Pending Approval",
            description: "Your vendor account is pending approval but you can still access your dashboard.",
            variant: "default"
          });
        }

        toast({
          title: "Welcome back, Vendor!",
          description: "You have been signed in successfully.",
        });

        navigate("/vendor-dashboard");
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
          <div className="mb-6">
            <Link 
              to="/auth" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to main login
            </Link>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-primary">Vendor Portal</h1>
            <p className="text-muted-foreground">Sign in to your vendor account or create a new one</p>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <Card>
                <CardHeader>
                  <CardTitle>Vendor Sign In</CardTitle>
                  <CardDescription>
                    Enter your vendor credentials to access your dashboard
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
                        placeholder="Enter your vendor email"
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
                      {loading ? "Signing in..." : "Sign In as Vendor"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            
            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Create Vendor Account</CardTitle>
                  <CardDescription>
                    Register as a vendor to start selling on our platform
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
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input 
                        id="businessName" 
                        name="businessName"
                        type="text" 
                        placeholder="Enter your business name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone/WhatsApp Number</Label>
                      <Input 
                        id="phone" 
                        name="phone"
                        type="tel" 
                        placeholder="Enter your phone/WhatsApp number"
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
                      {loading ? "Creating vendor account..." : "Sign Up as Vendor"}
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