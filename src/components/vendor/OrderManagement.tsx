import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Package, Truck, CheckCircle, XCircle, RefreshCw, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  { value: 'pending', label: 'Pending', icon: Package, color: 'bg-warning/10 text-warning' },
  { value: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'bg-primary/10 text-primary' },
  { value: 'shipped', label: 'Shipped', icon: Truck, color: 'bg-info/10 text-info' },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'bg-success/10 text-success' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'bg-destructive/10 text-destructive' },
];

const OrderManagement = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch customer profiles and order items for each order
      const ordersWithDetails = await Promise.all(
        (data || []).map(async (order) => {
          const [profileResult, itemsResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('full_name, email')
              .eq('user_id', order.customer_id)
              .maybeSingle(),
            supabase
              .from('order_items')
              .select('id, quantity, unit_price, product_id')
              .eq('order_id', order.id),
          ]);

          // Get product names for items
          const itemsWithProducts = await Promise.all(
            (itemsResult.data || []).map(async (item) => {
              const { data: product } = await supabase
                .from('products')
                .select('name')
                .eq('id', item.product_id)
                .maybeSingle();
              return { ...item, product };
            })
          );

          return {
            ...order,
            customer_profile: profileResult.data || undefined,
            items: itemsWithProducts,
          };
        })
      );

      setOrders(ordersWithDetails);
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

  const getStatusBadge = (status: string) => {
    const statusConfig = orderStatuses.find((s) => s.value === status);
    if (!statusConfig) return <Badge variant="secondary">{status}</Badge>;
    const Icon = statusConfig.icon;
    return (
      <Badge className={statusConfig.color}>
        <Icon className="mr-1 h-3 w-3" />
        {statusConfig.label}
      </Badge>
    );
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-border bg-card"
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-foreground">
              <ShoppingCart className="h-5 w-5" />
              Order Management
            </h2>
            <p className="text-sm text-muted-foreground">
              View and manage customer orders
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={fetchOrders} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                  Order ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin" />
                    <p className="mt-2">Loading orders...</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <ShoppingCart className="mx-auto mb-4 h-12 w-12 opacity-50" />
                    <p>No orders yet.</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-foreground">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">
                          {order.customer_profile?.full_name || 'Unknown'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.customer_profile?.email || 'No email'}
                        </p>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                      LKR {Number(order.total_amount).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
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
                          <SelectTrigger className="w-32">
                            <SelectValue />
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order #{selectedOrder?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid gap-4 rounded-lg border border-border p-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusBadge(selectedOrder.status)}
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
                            Qty: {item.quantity} × LKR {Number(item.unit_price).toLocaleString()}
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
