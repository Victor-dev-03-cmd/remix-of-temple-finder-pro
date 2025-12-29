import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, Edit, Trash2, Check, Clock, X, RefreshCw } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { productCategories } from '@/lib/categories';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import ProductImageUpload from './ProductImageUpload';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  cost_price: number | null;
  stock: number;
  category: string;
  sku: string | null;
  status: string;
  image_url: string | null;
  temple_id: string | null;
  created_at: string;
}

interface Temple {
  id: string;
  name: string;
}

const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(1000).optional().nullable(),
  price: z.coerce.number().min(1, 'Selling price must be at least 1'),
  cost_price: z.coerce.number().min(0, 'Cost price cannot be negative').optional().nullable(),
  stock: z.coerce.number().min(0, 'Stock cannot be negative'),
  category: z.string().min(1, 'Please select a category'),
  sku: z.string().max(50, 'SKU must be less than 50 characters').optional().nullable(),
  image_url: z.string().optional().nullable(),
  temple_id: z.string().min(1, 'An associated temple is required'),
});

type ProductFormValues = z.infer<typeof productSchema>;

const ProductManagement = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [vendorTemple, setVendorTemple] = useState<Temple | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      cost_price: 0,
      stock: 0,
      category: '',
      sku: '',
      image_url: null,
      temple_id: '',
    },
  });

  const fetchInitialData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch vendor's associated temple first
      const { data: templeData, error: templeError } = await supabase
        .from('temples')
        .select('id, name')
        .eq('owner_user_id', user.id)
        .maybeSingle();

      if (templeError) throw templeError;
      if (templeData) {
        setVendorTemple(templeData);
        form.setValue('temple_id', templeData.id);
      }

      // Fetch products for the vendor
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;
      setProducts(productsData || []);

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

  const onSubmit = async (values: ProductFormValues) => {
    if (!user || !vendorTemple) {
      toast({ title: 'Error', description: 'Cannot save product without an associated temple.', variant: 'destructive' });
      return;
    }

    try {
      const productData = {
        ...values,
        temple_id: vendorTemple.id, // Ensure the temple_id is the vendor's temple
      };
      
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast({ title: 'Product Updated', description: 'Your product has been updated.' });
      } else {
        const { error } = await supabase.from('products').insert({
          ...productData,
          vendor_id: user.id,
          status: 'approved', // Or 'pending' if you have an approval flow
        });

        if (error) throw error;
        toast({ title: 'Product Added', description: 'Your product has been added.' });
      }

      setShowForm(false);
      setEditingProduct(null);
      form.reset();
      fetchInitialData(); // Refetch all data
    } catch (error) {
      console.error('Error saving product:', error);
      toast({ title: 'Error', description: `Failed to save product: ${(error as Error).message}`, variant: 'destructive' });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      ...product,
      description: product.description || '',
      sku: product.sku || '',
      cost_price: product.cost_price,
      temple_id: product.temple_id || vendorTemple?.id,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Product Deleted', description: 'The product has been removed.' });
      setDeletingId(null);
      fetchInitialData(); // Refetch all data
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({ title: 'Error', description: 'Failed to delete product.', variant: 'destructive' });
    }
  };

  const openAddForm = () => {
    if (!vendorTemple) {
      toast({ title: 'Cannot Add Product', description: 'You must create your temple before adding products.', variant: 'warning' });
      // Optionally, you could redirect to the temple creation page
      return;
    }
    setEditingProduct(null);
    form.reset();
    form.setValue('temple_id', vendorTemple.id);
    setShowForm(true);
  };

  // Memoize status badge for performance
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
            <Button onClick={openAddForm} className="gap-2">
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
                      LKR {Number(product.price).toLocaleString()} | Stock: {product.stock} | SKU: {product.sku || 'N/A'}
                    </p>
                    <div className="mt-1"><StatusBadge status={product.status} /></div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
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

      {/* Add/Edit Product Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="rounded-lg sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Update product details for' : 'Add a new product for'} <strong>{vendorTemple?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 pt-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Brass Temple Bell" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="cost_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Price (LKR)</FormLabel>
                      <FormControl><Input type="number" placeholder="0" {...field} value={field.value ?? ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selling Price (LKR)</FormLabel>
                      <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Quantity</FormLabel>
                      <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {productCategories.map((cat) => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU (optional)</FormLabel>
                      <FormControl><Input placeholder="e.g., SKU00123" {...field} value={field.value ?? ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe your product..." className="min-h-[100px]" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="temple_id"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormLabel>Associated Temple</FormLabel>
                     <FormControl>
                       <Input {...field} readOnly />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
               <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Image</FormLabel>
                    <FormControl>
                      <ProductImageUpload
                        currentImageUrl={field.value}
                        onImageUploaded={(url) => field.onChange(url)}
                        onImageRemoved={() => field.onChange(null)}
                        productId={editingProduct?.id}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting || !vendorTemple}>
                  {form.formState.isSubmitting ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <DialogContent className="rounded-lg">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => deletingId && handleDelete(deletingId)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductManagement;
