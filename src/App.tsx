import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { SiteSettingsProvider } from "./contexts/SiteSettingsContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import CartSheet from "./components/cart/CartSheet";
import ChatWidget from "./components/chat/ChatWidget";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import TempleDetail from "./pages/TempleDetail";
import Temples from "./pages/Temples";
import BecomeVendor from "./pages/BecomeVendor";
import Auth from "./pages/Auth";
import Checkout from "./pages/Checkout";
import CustomerDashboard from "./pages/dashboards/CustomerDashboard";
import CustomerOrders from "./pages/customer/CustomerOrders";
import CustomerFavoritesPage from "./pages/customer/CustomerFavoritesPage";
import CustomerProfilePage from "./pages/customer/CustomerProfilePage";
import VendorDashboard from "./pages/dashboards/VendorDashboard";
import VendorProducts from "./pages/vendor/VendorProducts";
import VendorOrders from "./pages/vendor/VendorOrders";
import VendorTemple from "./pages/vendor/VendorTemple";
import VendorAnalyticsPage from "./pages/vendor/VendorAnalyticsPage";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import VendorApplications from "./pages/admin/VendorApplications";
import UserManagementPage from "./pages/admin/UserManagementPage";
import SiteSettingsPage from "./pages/admin/SiteSettingsPage";
import TempleManagementPage from "./pages/admin/TempleManagementPage";
import BookingManagementPage from "./pages/admin/BookingManagementPage";
import BookingLookup from "./pages/BookingLookup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <Auth />;
};

const AppRoutes = () => {
  return (
    <>
      <CartSheet />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Index />} />
        <Route path="/temples" element={<Temples />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/temples/:id" element={<TempleDetail />} />
        <Route path="/become-vendor" element={<BecomeVendor />} />
        <Route path="/booking" element={<BookingLookup />} />
        <Route path="/auth" element={<AuthRoute />} />
        <Route path="/checkout" element={<Checkout />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/orders"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/favorites"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerFavoritesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/profile"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor"
          element={
            <ProtectedRoute allowedRoles={['vendor']}>
              <VendorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/temple"
          element={
            <ProtectedRoute allowedRoles={['vendor']}>
              <VendorTemple />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/products"
          element={
            <ProtectedRoute allowedRoles={['vendor']}>
              <VendorProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/orders"
          element={
            <ProtectedRoute allowedRoles={['vendor']}>
              <VendorOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/analytics"
          element={
            <ProtectedRoute allowedRoles={['vendor']}>
              <VendorAnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/vendor-applications"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <VendorApplications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SiteSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/temples"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <TempleManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bookings"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <BookingManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <SiteSettingsProvider>
              <CartProvider>
                <Toaster />
                <Sonner />
                <AppRoutes />
                <ChatWidget />
              </CartProvider>
            </SiteSettingsProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
