import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Plus, Edit, Trash2, Check, Clock, X, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

interface ProductVariant {
  id?: string;
  name: string;
  sku?: string | null;
  price: number;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string;
  status: string;
  image_url: string | null;
  temple_id: string | null;
  created_at: string;
  variants: ProductVariant[];
}

interface Temple {
  id: string;
  name: string;
}

const ProductManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [vendorTemple, setVendorTemple] = useState<Temple | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchInitialData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: templeData, error: templeError } = await supabase
        .from('temples')
        .select('id, name')
        .eq('owner_user_id', user.id)
        .maybeSingle();

      if (templeError) throw templeError;
      if (templeData) {
        setVendorTemple(templeData);
      }

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*, variants:product_variants(*)')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;
      
      const mappedProducts: Product[] = (productsData || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        stock: p.stock,
        category: p.category,
        status: p.status,
        image_url: p.image_url,
        temple_id: p.temple_id,
        created_at: p.created_at,
        variants: (p.variants || []).map((v: any) => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          price: v.price,
          stock: v.stock,
        })),
      }));
      
      setProducts(mappedProducts);

    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast({ title: 'Error', description: 'Failed to load your data.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Product Deleted', description: 'The product has been removed.' });
      setDeletingId(null);
      fetchInitialData();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({ title: 'Error', description: 'Failed to delete product.', variant: 'destructive' });
    }
  };

  const openAddPage = () => {
    if (!vendorTemple) {
      toast({ title: 'Cannot Add Product', description: 'You must create your temple before adding products.', variant: 'destructive' });
      return;
    }
    navigate('/vendor/products/add');
  };

  const handleEdit = (id: string) => {
    navigate(`/vendor/products/edit/${id}`);
  };

  const StatusBadge = useMemo(() => ({ status }: { status: string }) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success/10 text-success"><Check className="mr-1 h-3 w-3" />Approved</Badge>;
      case 'pending':
        return <Badge className="bg-warning/10 text-warning"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/10 text-destructive"><X className="mr-1 h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }, []);

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
              Product Management
            </h2>
            <p className="text-sm text-muted-foreground">
              Add and manage products for your temple: <strong>{vendorTemple?.name || 'No Temple Found'}</strong>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={fetchInitialData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={openAddPage} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>

        <div className="divide-y divide-border">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Package className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>No products yet. Add your first product!</p>
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-primary/10">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      LKR {Number(product.price).toLocaleString()} | Stock: {product.stock}
                       {product.variants.length > 1 && ` | ${product.variants.length} variants`}
                    </p>
                    <div className="mt-1"><StatusBadge status={product.status} /></div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(product.id)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeletingId(product.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deletingId && handleDelete(deletingId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductManagement;
