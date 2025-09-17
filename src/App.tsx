import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ProductDetailPage from "./pages/ProductDetailPage";
import NotFound from "./pages/NotFound";
import ProductsPage from "./pages/ProductsPage";
import AuthPage from "./pages/AuthPage";
import VendorAuthPage from "./pages/VendorAuthPage";
import AdminAuthPage from "./pages/AdminAuthPage";
import WishlistPage from "./pages/WishlistPage";
import BrandsPage from "./pages/BrandsPage";
import VendorDashboard from "./pages/VendorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProfilePage from "./pages/ProfilePage";
import CategoryPage from "./pages/CategoryPage";
import BrandDetailPage from "./pages/BrandDetailPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/vendor-auth" element={<VendorAuthPage />} />
          <Route path="/admin-auth" element={<AdminAuthPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/brands" element={<BrandsPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/vendor-dashboard" element={<VendorDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/brand/:slug" element={<BrandDetailPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
