import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, RefreshCw, Eye, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  product: {
    name: string;
  } | null;
}

interface Order {
  id: string;
  customer_id: string;
  status: string;
  total_amount: number;
  shipping_address: string | null;
  notes: string | null;
  created_at: string;
  customer_profile?: {
    full_name: string | null;
    email: string | null;
  };
  items?: OrderItem[];
}

const orderStatuses = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-500' },
  { value: 'shipped', label: 'Shipped', color: 'bg-cyan-500' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
];

const OrderManagement = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch orders for this vendor
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Fetch customer profiles
      const customerIds = [...new Set(ordersData.map(o => o.customer_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', customerIds);

      // Fetch order items with product info
      const orderIds = ordersData.map(o => o.id);
      const { data: itemsData } = await supabase
        .from('order_items')
        .select(`
          id,
          order_id,
          quantity,
          unit_price,
          product_id
        `)
        .in('order_id', orderIds);

      // Fetch products for items
      const productIds = [...new Set((itemsData || []).map(i => i.product_id))];
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds);

      // Combine data
      const enrichedOrders: Order[] = ordersData.map(order => {
        const profile = profilesData?.find(p => p.user_id === order.customer_id);
        const items = (itemsData || [])
          .filter(i => i.order_id === order.id)
          .map(item => ({
            id: item.id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            product: productsData?.find(p => p.id === item.product_id) || null,
          }));

        return {
          ...order,
          customer_profile: profile ? {
            full_name: profile.full_name,
            email: profile.email,
          } : undefined,
          items,
        };
      });

      setOrders(enrichedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch orders.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      toast({
        title: 'Order Updated',
        description: `Order status changed to ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order status.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };
  
  const filteredOrders = orders.filter((order) => {
    const searchLower = searchQuery.toLowerCase();
    const orderIdMatch = order.id.slice(0, 8).toLowerCase().includes(searchLower);
    const customerNameMatch = (order.customer_profile?.full_name || '').toLowerCase().includes(searchLower);
    const customerEmailMatch = (order.customer_profile?.email || '').toLowerCase().includes(searchLower);
    return orderIdMatch || customerNameMatch || customerEmailMatch;
  });

  const getStatusDisplay = (status: string) => {
    const statusConfig = orderStatuses.find((s) => s.value === status);
    const bulletColor = statusConfig?.color || 'bg-gray-400';

    return (
      <div className="flex items-center">
        <span className={`mr-2 h-2 w-2 rounded-full ${bulletColor}`} />
        <span className="capitalize">{statusConfig?.label || status}</span>
      </div>
    );
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-border bg-card"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border p-4 gap-4">
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-foreground">
              <ShoppingCart className="h-5 w-5" />
              Order Management
            </h2>
            <p className="text-sm text-muted-foreground">
              View and manage customer orders
            </p>
          </div>
          <div className="flex items-center gap-2">
             <div className="relative w-full max-w-xs">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
               <Input
                  placeholder="Filter by ID, name, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
              />
             </div>
            <Button variant="outline" size="icon" onClick={fetchOrders} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left">
                <th className="px-4 py-3 font-medium uppercase text-muted-foreground">
                  Order ID
                </th>
                <th className="px-4 py-3 font-medium uppercase text-muted-foreground">
                  Customer
                </th>
                <th className="px-4 py-3 font-medium uppercase text-muted-foreground">
                  Total
                </th>
                <th className="px-4 py-3 font-medium uppercase text-muted-foreground">
                  Date
                </th>
                <th className="px-4 py-3 font-medium uppercase text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 font-medium uppercase text-muted-foreground text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin" />
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <ShoppingCart className="mx-auto mb-4 h-12 w-12 opacity-50" />
                    <p>{searchQuery ? 'No orders match your search.' : 'You have no orders yet.'}</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-foreground">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">
                          {order.customer_profile?.full_name || 'Unknown'}
                        </p>
                        <p className="text-muted-foreground">
                          {order.customer_profile?.email || 'No email'}
                        </p>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                      LKR {Number(order.total_amount).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {getStatusDisplay(order.status)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          View
                        </Button>
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusChange(order.id, value)}
                          disabled={updatingId === order.id}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue placeholder="Change status..." />
                          </SelectTrigger>
                          <SelectContent>
                            {orderStatuses.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order #{selectedOrder?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 pt-2">
              <div className="grid gap-4 rounded-lg border border-border p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusDisplay(selectedOrder.status)}
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Customer</span>
                  <p className="font-medium text-foreground">
                    {selectedOrder.customer_profile?.full_name || 'Unknown'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.customer_profile?.email}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Shipping Address</span>
                  <p className="text-foreground">
                    {selectedOrder.shipping_address || 'Not provided'}
                  </p>
                </div>
                {selectedOrder.notes && (
                  <div>
                    <span className="text-sm text-muted-foreground">Notes</span>
                    <p className="text-foreground">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="rounded-lg border border-border">
                  <div className="border-b border-border p-3">
                    <h4 className="font-medium text-foreground">Order Items</h4>
                  </div>
                  <div className="divide-y divide-border">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between p-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {item.product?.name || 'Unknown Product'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity} &times; LKR {Number(item.unit_price).toLocaleString()}
                          </p>
                        </div>
                        <p className="font-medium text-foreground">
                          LKR {(item.quantity * Number(item.unit_price)).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border bg-muted/50 p-3">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>LKR {Number(selectedOrder.total_amount).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderManagement;
