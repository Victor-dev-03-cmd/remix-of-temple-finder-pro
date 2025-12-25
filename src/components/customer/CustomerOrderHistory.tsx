import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Eye, RefreshCw, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  vendor_id: string;
  status: string;
  total_amount: number;
  shipping_address: string | null;
  created_at: string;
  vendor_profile?: {
    full_name: string | null;
  };
  items?: OrderItem[];
}

const statusConfig = {
  pending: { icon: Clock, label: 'Pending', color: 'bg-warning/10 text-warning' },
  confirmed: { icon: CheckCircle, label: 'Confirmed', color: 'bg-primary/10 text-primary' },
  shipped: { icon: Truck, label: 'Shipped', color: 'bg-info/10 text-info' },
  delivered: { icon: CheckCircle, label: 'Delivered', color: 'bg-success/10 text-success' },
  cancelled: { icon: XCircle, label: 'Cancelled', color: 'bg-destructive/10 text-destructive' },
};

const CustomerOrderHistory = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch vendor profiles and order items
      const ordersWithDetails = await Promise.all(
        (data || []).map(async (order) => {
          const [vendorResult, itemsResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', order.vendor_id)
              .maybeSingle(),
            supabase
              .from('order_items')
              .select('id, quantity, unit_price, product_id')
              .eq('order_id', order.id),
          ]);

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
            vendor_profile: vendorResult.data || undefined,
            items: itemsWithProducts,
          };
        })
      );

      setOrders(ordersWithDetails);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return <Badge variant="secondary">{status}</Badge>;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
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
              <Package className="h-5 w-5" />
              Order History
            </h2>
            <p className="text-sm text-muted-foreground">View all your past orders</p>
          </div>
          <Button variant="outline" size="icon" onClick={fetchOrders} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="divide-y divide-border">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Package className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>No orders yet. Start shopping!</p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <div>
                  <p className="font-medium text-foreground font-mono">
                    #{order.id.slice(0, 8)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()} •{' '}
                    {order.vendor_profile?.full_name || 'Vendor'}
                  </p>
                  <div className="mt-1">{getStatusBadge(order.status)}</div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold text-foreground">
                    LKR {Number(order.total_amount).toLocaleString()}
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>
                    <Eye className="mr-1 h-4 w-4" />
                    View
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>Order #{selectedOrder?.id.slice(0, 8)}</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid gap-3 rounded-lg border border-border p-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Date</span>
                  <span className="text-foreground">
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Vendor</span>
                  <span className="text-foreground">
                    {selectedOrder.vendor_profile?.full_name || 'Unknown'}
                  </span>
                </div>
                {selectedOrder.shipping_address && (
                  <div>
                    <span className="text-sm text-muted-foreground">Shipping Address</span>
                    <p className="text-foreground">{selectedOrder.shipping_address}</p>
                  </div>
                )}
              </div>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="rounded-lg border border-border">
                  <div className="border-b border-border p-3">
                    <h4 className="font-medium text-foreground">Items</h4>
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

export default CustomerOrderHistory;
