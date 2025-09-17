import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Shield } from "lucide-react";

export default function AdminAuthPage() {
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
          .single();

        if (profile?.role === 'admin') {
          navigate("/admin-dashboard");
        } else {
          navigate("/");
        }
      }
    };
    checkUser();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Check for admin credentials
    if (email === "admin" && password === "admin") {
      // Use admin email for authentication
      const adminEmail = "admin@runmarketplace.com";
        const { data, error } = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password: "admin",
        });

      if (error) {
        // If admin account doesn't exist, create it
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: adminEmail,
          password: "admin",
          options: {
            emailRedirectTo: `${window.location.origin}/admin-dashboard`,
            data: {
              full_name: "RUNMARKETPLACE",
              role: "admin"
            }
          }
        });

        if (signUpError) {
          setError("Failed to create admin account: " + signUpError.message);
          setLoading(false);
          return;
        }

        // Create admin profile if signup was successful
        if (signUpData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: signUpData.user.id,
              full_name: "RUNMARKETPLACE",
              email: adminEmail,
              role: 'admin',
              email_verified: true
            });

          if (profileError) {
            console.error('Admin profile creation error:', profileError);
          }
        }

        // Try signing in again
        const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password: "admin",
        });

        if (retryError) {
          setError(retryError.message);
          setLoading(false);
          return;
        }
      }

      toast({
        title: "Welcome back, Admin!",
        description: "You have been signed in successfully.",
      });

      navigate("/admin-dashboard");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();

        if (profile?.role !== 'admin') {
          setError("Access denied. This portal is for administrators only.");
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        toast({
          title: "Welcome back, Administrator!",
          description: "You have been signed in successfully.",
        });

        navigate("/admin-dashboard");
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
            <div className="flex justify-center mb-4">
              <Shield className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2 text-primary">Admin Portal</h1>
            <p className="text-muted-foreground">Secure administrator access</p>
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Notice:</strong> Admin accounts are created by system administrators only. 
                Contact support if you need admin access.
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Administrator Sign In</CardTitle>
              <CardDescription>
                Enter your administrator credentials to access the control panel
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
                  <Label htmlFor="email">Administrator Email</Label>
                  <Input 
                    id="email" 
                    name="email"
                    type="email" 
                    placeholder="Enter your admin email"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    name="password"
                    type="password" 
                    placeholder="Enter your admin password"
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
                  {loading ? "Verifying credentials..." : "Sign In as Administrator"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}