import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VendorStats {
  totalProducts: number;
  totalVariants: number;
  totalStock: number;
  totalSales: number;
  totalRevenue: number;
  totalBookings: number;
  pendingOrders: number;
  completedOrders: number;
}

interface TempleInfo {
  id: string;
  name: string;
  deity: string;
  district: string;
  province: string;
  country: string;
  imageUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
  isActive: boolean;
}

interface VendorDetails {
  id: string;
  businessName: string;
  templeName: string;
  email: string;
  phone: string | null;
  status: string;
  createdAt: string;
  templeId: string | null;
  temple: TempleInfo | null;
  stats: VendorStats;
  monthlySales: { month: string; sales: number; revenue: number }[];
  productCategories: { category: string; count: number }[];
  orderStatuses: { status: string; count: number }[];
}

interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  templeName: string;
  email: string;
  status: string;
  createdAt: string;
  totalProducts: number;
  totalRevenue: number;
}

export const useVendorManagement = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<VendorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      // Get all approved vendor applications
      const { data: applications, error: appError } = await supabase
        .from('vendor_applications')
        .select('id, user_id, business_name, temple_name, phone, status, created_at')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (appError) throw appError;

      // Get products count and revenue for each vendor
      const vendorsWithStats = await Promise.all(
        (applications || []).map(async (app) => {
          // Get products count
          const { count: productCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('vendor_id', app.user_id);

          // Get total revenue from orders
          const { data: orders } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('vendor_id', app.user_id)
            .eq('status', 'delivered');

          const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

          // Get profile email
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('user_id', app.user_id)
            .single();

          return {
            id: app.id,
            userId: app.user_id,
            businessName: app.business_name,
            templeName: app.temple_name,
            email: profile?.email || '',
            status: app.status,
            createdAt: app.created_at,
            totalProducts: productCount || 0,
            totalRevenue,
          };
        })
      );

      setVendors(vendorsWithStats);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectVendorQuick = (vendor: Vendor) => {
    // Immediately show vendor with basic info while loading details
    setSelectedVendor({
      id: vendor.id,
      businessName: vendor.businessName,
      templeName: vendor.templeName,
      email: vendor.email,
      phone: null,
      status: vendor.status,
      createdAt: vendor.createdAt,
      templeId: null,
      temple: null,
      stats: {
        totalProducts: vendor.totalProducts,
        totalVariants: 0,
        totalStock: 0,
        totalSales: 0,
        totalRevenue: vendor.totalRevenue,
        totalBookings: 0,
        pendingOrders: 0,
        completedOrders: 0,
      },
      monthlySales: [],
      productCategories: [],
      orderStatuses: [],
    });
    
    // Then fetch full details in background
    fetchVendorDetails(vendor.userId, vendor.id);
  };

  const fetchVendorDetails = async (vendorUserId: string, applicationId: string) => {
    setDetailsLoading(true);
    try {
      // Get vendor application details
      const { data: app } = await supabase
        .from('vendor_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, phone')
        .eq('user_id', vendorUserId)
        .single();

      // Get all products with variants
      const { data: products } = await supabase
        .from('products')
        .select('id, category, price, stock')
        .eq('vendor_id', vendorUserId);

      // Get all variants for these products
      const productIds = products?.map(p => p.id) || [];
      const { data: variants } = await supabase
        .from('product_variants')
        .select('stock, product_id')
        .in('product_id', productIds.length > 0 ? productIds : ['00000000-0000-0000-0000-000000000000']);

      // Get orders
      const { data: orders } = await supabase
        .from('orders')
        .select('id, status, total_amount, created_at')
        .eq('vendor_id', vendorUserId);

      // Get temple created by this vendor
      const { data: temple } = await supabase
        .from('temples')
        .select('id, name, deity, district, province, country, image_url, rating, review_count, is_active')
        .eq('owner_user_id', vendorUserId)
        .maybeSingle();

      let bookings: any[] = [];
      if (temple?.id) {
        const { data: bookingData } = await supabase
          .from('temple_bookings')
          .select('id, status, created_at, num_tickets')
          .eq('temple_id', temple.id);
        bookings = bookingData || [];
      }

      // Calculate stats
      const totalProducts = products?.length || 0;
      const totalVariants = variants?.length || 0;
      const totalStock = (products?.reduce((sum, p) => sum + p.stock, 0) || 0) + 
                         (variants?.reduce((sum, v) => sum + v.stock, 0) || 0);
      const deliveredOrders = orders?.filter(o => o.status === 'delivered') || [];
      const totalSales = deliveredOrders.length;
      const totalRevenue = deliveredOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
      const totalBookings = bookings.length;
      const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
      const completedOrders = deliveredOrders.length;

      // Calculate monthly sales (last 6 months)
      const monthlySales = calculateMonthlySales(orders || []);

      // Calculate product categories distribution
      const productCategories = calculateCategoryDistribution(products || []);

      // Calculate order status distribution
      const orderStatuses = calculateOrderStatusDistribution(orders || []);

      const templeInfo: TempleInfo | null = temple ? {
        id: temple.id,
        name: temple.name,
        deity: temple.deity,
        district: temple.district,
        province: temple.province,
        country: temple.country,
        imageUrl: temple.image_url,
        rating: temple.rating,
        reviewCount: temple.review_count,
        isActive: temple.is_active ?? true,
      } : null;

      setSelectedVendor({
        id: applicationId,
        businessName: app?.business_name || '',
        templeName: app?.temple_name || '',
        email: profile?.email || '',
        phone: profile?.phone || app?.phone || null,
        status: app?.status || '',
        createdAt: app?.created_at || '',
        templeId: temple?.id || null,
        temple: templeInfo,
        stats: {
          totalProducts,
          totalVariants,
          totalStock,
          totalSales,
          totalRevenue,
          totalBookings,
          pendingOrders,
          completedOrders,
        },
        monthlySales,
        productCategories,
        orderStatuses,
      });
    } catch (error) {
      console.error('Error fetching vendor details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const calculateMonthlySales = (orders: any[]) => {
    const months: { [key: string]: { sales: number; revenue: number } } = {};
    const now = new Date();

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      months[key] = { sales: 0, revenue: 0 };
    }

    orders.forEach(order => {
      if (order.status === 'delivered') {
        const date = new Date(order.created_at);
        const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        if (months[key]) {
          months[key].sales += 1;
          months[key].revenue += Number(order.total_amount);
        }
      }
    });

    return Object.entries(months).map(([month, data]) => ({
      month,
      sales: data.sales,
      revenue: data.revenue,
    }));
  };

  const calculateCategoryDistribution = (products: any[]) => {
    const categories: { [key: string]: number } = {};
    products.forEach(product => {
      categories[product.category] = (categories[product.category] || 0) + 1;
    });
    return Object.entries(categories).map(([category, count]) => ({ category, count }));
  };

  const calculateOrderStatusDistribution = (orders: any[]) => {
    const statuses: { [key: string]: number } = {};
    orders.forEach(order => {
      statuses[order.status] = (statuses[order.status] || 0) + 1;
    });
    return Object.entries(statuses).map(([status, count]) => ({ status, count }));
  };

  const clearSelectedVendor = () => {
    setSelectedVendor(null);
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  return {
    vendors,
    selectedVendor,
    loading,
    detailsLoading,
    fetchVendorDetails,
    selectVendorQuick,
    clearSelectedVendor,
    refetch: fetchVendors,
  };
};