import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { SiteSettingsProvider } from "./contexts/SiteSettingsContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import CartSheet from "./components/cart/CartSheet";
import ChatWidget from "./components/chat/ChatWidget";
import { supabase } from "@/integrations/supabase/client";

// Pages
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import TempleDetail from "./pages/TempleDetail";
import Temples from "./pages/Temples";
import BecomeVendor from "./pages/BecomeVendor";
import Auth from "./pages/Auth";
import Checkout from "./pages/Checkout";
import CartPage from "./pages/CartPage";
import CustomerDashboard from "./pages/dashboards/CustomerDashboard";
import CustomerOrders from "./pages/customer/CustomerOrders";
import CustomerFavoritesPage from "./pages/customer/CustomerFavoritesPage";
import CustomerProfilePage from "./pages/customer/CustomerProfilePage";
import VendorDashboard from "./pages/dashboards/VendorDashboard";
import VendorProducts from "./pages/vendor/VendorProducts";
import VendorOrders from "./pages/vendor/VendorOrders";
import VendorTemple from "./pages/vendor/VendorTemple";
import MyEarningsPage from "./pages/vendor/MyEarningsPage";
import VendorBookingsPage from "./pages/vendor/VendorBookingsPage";
import VendorAnalyticsPage from "./pages/vendor/VendorAnalyticsPage";
import InventoryManagementPage from "./pages/vendor/InventoryManagement";
import InvoiceCreationPage from "./pages/vendor/InvoiceCreation";
import PostUploadPage from './pages/vendor/PostUploadPage';
import SocialFeed from './pages/SocialFeed';
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import AdminChatPage from "./pages/admin/AdminChatPage";
import VendorManagementPage from "./pages/admin/VendorManagementPage";
import VendorApplications from "./pages/admin/VendorApplications";
import UserManagementPage from "./pages/admin/UserManagementPage";
import TempleManagementPage from "./pages/admin/TempleManagementPage";
import BookingManagementPage from "./pages/admin/BookingManagementPage";
import VendorBalancesPage from "./pages/admin/VendorBalancesPage";
import CountriesPage from "./pages/admin/CountriesPage";
import GeneralSettingsPage from "./pages/admin/GeneralSettingsPage";
import NotificationSettingsPage from './pages/admin/NotificationSettingsPage';
import SecuritySettingsPage from './pages/admin/SecuritySettingsPage';
import AppearanceSettingsPage from './pages/admin/AppearanceSettingsPage';
import ColorSettingsPage from './pages/admin/ColorSettingsPage';
import TypographySettingsPage from './pages/admin/TypographySettingsPage';
import HeroSettingsPage from './pages/admin/HeroSettingsPage';
import FooterSettingsPage from './pages/admin/FooterSettingsPage';
import EmailTemplateSettingsPage from './pages/admin/EmailTemplateSettingsPage';
import HomeGallerySettingsPage from './pages/admin/HomeGallerySettingsPage';
import ServiceSettingsPage from "./pages/admin/ServiceSettingsPage";
import BookingLookup from "./pages/BookingLookup";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import CustomCursor from "./components/ui/CustomCursor";

const queryClient = new QueryClient();

// --- MODERN PAGE LOADER WITH TEMPLE ICON & SPINNER ---
const GlobalLoadingSkeleton = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-background w-full">
    <div className="relative flex flex-col items-center gap-6">
      <div className="relative">
        <div className="flex h-20 w-20 items-center justify-center rounded-[50%] bg-primary/10">
          <span className="text-4xl text-primary">ૐ</span>
        </div>
        <div className="absolute -inset-2 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-xl font-semibold text-primary animate-pulse">Asroz Info</h2>
        <p className="text-sm text-muted-foreground">Loading your experience...</p>
      </div>
      <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary" style={{ animation: 'progress 1.5s linear forwards' }} />
      </div>
    </div>
    <style>{`@keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }`}</style>
  </div>
);

// --- ACCESS DENIED UI FOR BLOCKED COUNTRIES ---
const AccessDenied = () => (
  <div className="h-screen w-screen flex flex-col items-center justify-center bg-background p-6 text-center">
    <div className="max-w-md p-10 bg-card rounded-3xl shadow-2xl border border-destructive/20">
      <div className="h-24 w-24 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-5xl font-bold">!</span>
      </div>
      <h1 className="text-3xl font-display font-bold text-foreground mb-4">Access Restricted</h1>
      <p className="text-muted-foreground leading-relaxed">
        We apologize, but Temple Info services are currently not available in your region due to local policy or administrative restrictions.
      </p>
      <div className="mt-8 pt-6 border-t border-muted text-xs text-muted-foreground">
        Your IP location: <span className="font-mono font-bold uppercase tracking-wider">Restricted</span> | Error Code: REGION_BLOCKED
      </div>
    </div>
  </div>
);

// Redirect authenticated users away from auth page
const AuthRoute = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;
  return <Auth />;
};

const AppRoutes = () => {
  return (
    <>
     <CustomCursor />
      <CartSheet />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Index />} />
        <Route path="/temples" element={<Temples />} />
        <Route path="/products" element={<Products />} />
        <Route path="/social-feed" element={<SocialFeed />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/temples/:id" element={<TempleDetail />} />
        <Route path="/become-vendor" element={<BecomeVendor />} />
        <Route path="/booking" element={<BookingLookup />} />
        <Route path="/auth" element={<AuthRoute />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/cart" element={<CartPage />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['customer']}><CustomerDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/orders" element={<ProtectedRoute allowedRoles={['customer']}><CustomerOrders /></ProtectedRoute>} />
        <Route path="/dashboard/favorites" element={<ProtectedRoute allowedRoles={['customer']}><CustomerFavoritesPage /></ProtectedRoute>} />
        <Route path="/dashboard/profile" element={<ProtectedRoute allowedRoles={['customer']}><CustomerProfilePage /></ProtectedRoute>} />
        
        <Route path="/vendor" element={<ProtectedRoute allowedRoles={['vendor']}><VendorDashboard /></ProtectedRoute>} />
        <Route path="/vendor/temple" element={<ProtectedRoute allowedRoles={['vendor']}><VendorTemple /></ProtectedRoute>} />
        <Route path="/vendor/products" element={<ProtectedRoute allowedRoles={['vendor']}><VendorProducts /></ProtectedRoute>} />
        <Route path="/vendor/orders" element={<ProtectedRoute allowedRoles={['vendor']}><VendorOrders /></ProtectedRoute>} />
        <Route path="/vendor/earnings" element={<ProtectedRoute allowedRoles={['vendor']}><MyEarningsPage /></ProtectedRoute>} />
        <Route path="/vendor/analytics" element={<ProtectedRoute allowedRoles={['vendor']}><VendorAnalyticsPage /></ProtectedRoute>} />
        <Route path="/vendor/bookings" element={<ProtectedRoute allowedRoles={['vendor']}><VendorBookingsPage /></ProtectedRoute>} />
        <Route path="/vendor/inventory" element={<ProtectedRoute allowedRoles={['vendor']}><InventoryManagementPage /></ProtectedRoute>} />
        <Route path="/vendor/invoices" element={<ProtectedRoute allowedRoles={['vendor']}><InvoiceCreationPage /></ProtectedRoute>} />
        <Route path="/vendor/postupload" element={<ProtectedRoute allowedRoles={['vendor']}><PostUploadPage /></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/chat" element={<ProtectedRoute allowedRoles={['admin']}><AdminChatPage /></ProtectedRoute>} />
        <Route path="/admin/vendors" element={<ProtectedRoute allowedRoles={['admin']}><VendorManagementPage /></ProtectedRoute>} />
        <Route path="/admin/vendor-applications" element={<ProtectedRoute allowedRoles={['admin']}><VendorApplications /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagementPage /></ProtectedRoute>} />
        <Route path="/admin/temples" element={<ProtectedRoute allowedRoles={['admin']}><TempleManagementPage /></ProtectedRoute>} />
        <Route path="/admin/bookings" element={<ProtectedRoute allowedRoles={['admin']}><BookingManagementPage /></ProtectedRoute>} />
        <Route path="/admin/vendor-balances" element={<ProtectedRoute allowedRoles={['admin']}><VendorBalancesPage /></ProtectedRoute>} />
        <Route path="/admin/countries" element={<ProtectedRoute allowedRoles={['admin']}><CountriesPage /></ProtectedRoute>} />
        <Route path="/admin/settings/general" element={<ProtectedRoute allowedRoles={['admin']}><GeneralSettingsPage /></ProtectedRoute>} />
        <Route path="/admin/settings/notifications" element={<ProtectedRoute allowedRoles={['admin']}><NotificationSettingsPage /></ProtectedRoute>} />
        <Route path="/admin/settings/security" element={<ProtectedRoute allowedRoles={['admin']}><SecuritySettingsPage /></ProtectedRoute>} />
        <Route path="/admin/settings/appearance" element={<ProtectedRoute allowedRoles={['admin']}><AppearanceSettingsPage /></ProtectedRoute>} />
        <Route path="/admin/settings/colors" element={<ProtectedRoute allowedRoles={['admin']}><ColorSettingsPage /></ProtectedRoute>} />
        <Route path="/admin/settings/typography" element={<ProtectedRoute allowedRoles={['admin']}><TypographySettingsPage /></ProtectedRoute>} />
        <Route path="/admin/settings/hero" element={<ProtectedRoute allowedRoles={['admin']}><HeroSettingsPage /></ProtectedRoute>} />
        <Route path="/admin/settings/footer" element={<ProtectedRoute allowedRoles={['admin']}><FooterSettingsPage /></ProtectedRoute>} />
        <Route path="/admin/settings/email-templates" element={<ProtectedRoute allowedRoles={['admin']}><EmailTemplateSettingsPage /></ProtectedRoute>} />
        <Route path="/admin/settings/home-gallery" element={<ProtectedRoute allowedRoles={['admin']}><HomeGallerySettingsPage /></ProtectedRoute>} />
        <Route path="/admin/settings/services" element={<ProtectedRoute allowedRoles={['admin']}><ServiceSettingsPage /></ProtectedRoute>} />

        <Route path="/settings" element={<ProtectedRoute allowedRoles={['admin', 'vendor', 'customer']}><Settings /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isGeoBlocked, setIsGeoBlocked] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 1. Check IP and Country
        const geoRes = await fetch('https://ipapi.co/json/');
        const geoData = await geoRes.json();
        const userCountry = geoData.country_code;

        // 2. Check Database for Blocked Status
        const { data } = await (supabase
          .from('countries_config' as any)
          .select('is_blocked')
          .eq('country_code', userCountry)
          .maybeSingle() as any);

        if (data?.is_blocked) {
          setIsGeoBlocked(true);
        }
      } catch (err) {
        console.error("Geo-blocking check failed:", err);
        // If API fails, we proceed by default
      } finally {
        // Minimum loading time for the animation
        setTimeout(() => {
          setIsInitialLoading(false);
        }, 3000);
      }
    };

    initializeApp();
  }, []);

  // If the country is blocked, show ONLY the AccessDenied screen
  if (!isInitialLoading && isGeoBlocked) {
    return <AccessDenied />;
  }

  return (
    <HelmetProvider>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <BrowserRouter>
              <AuthProvider>
                <SiteSettingsProvider>
                  <CartProvider>
                    <Toaster />
                    <Sonner />
                    {/* Shows Loader for 3s, then the Website */}
                    {isInitialLoading ? <GlobalLoadingSkeleton /> : <AppRoutes />}
                    <ChatWidget />
                  </CartProvider>
                </SiteSettingsProvider>
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </I18nextProvider>
    </HelmetProvider>
  );
};

export default App;
