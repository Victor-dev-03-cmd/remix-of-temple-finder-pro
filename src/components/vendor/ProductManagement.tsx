import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, Edit, Trash2, Check, Clock, X, RefreshCw, GitCommitHorizontal } from 'lucide-react';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
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

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Variant name is required'),
  sku: z.string().optional().nullable(),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
  stock: z.coerce.number().min(0, 'Stock must be non-negative'),
});

const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(1000).optional().nullable(),
  category: z.string().min(1, 'Please select a category'),
  image_url: z.string().optional().nullable(),
  temple_id: z.string().min(1, 'An associated temple is required'),
  variants: z.array(variantSchema).min(1, 'At least one product variant is required'),
});

type ProductFormValues = z.infer<typeof productSchema>;

const emptyFormValues: Omit<ProductFormValues, 'temple_id'> = {
  name: '',
  description: '',
  category: '',
  image_url: null,
  variants: [{
    name: 'Default',
    price: 0,
    stock: 0,
    sku: ''
  }],
};


const ProductManagement = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [vendorTemple, setVendorTemple] = useState<Temple | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const variantSectionRef = useRef<HTMLDivElement>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: emptyFormValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });

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
        form.setValue('temple_id', templeData.id);
      }

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*, variants:product_variants(*)')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;
      
      // Map the data to match our Product interface
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

  const scrollToVariants = () => {
    setTimeout(() => {
      variantSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const onSubmit = async (values: ProductFormValues) => {
    if (!user || !vendorTemple) {
      toast({ title: 'Error', description: 'Cannot save product without an associated temple.', variant: 'destructive' });
      return;
    }

    try {
      const { variants, ...productData } = values;
      const baseProduct = {
        name: productData.name,
        description: productData.description,
        category: productData.category,
        image_url: productData.image_url,
        vendor_id: user.id,
        temple_id: vendorTemple.id,
        price: variants.length > 0 ? Math.min(...variants.map(v => v.price)) : 0,
        stock: variants.reduce((acc, v) => acc + v.stock, 0),
      };

      if (editingProduct) {
        const { data: updatedProduct, error: productError } = await supabase
          .from('products')
          .update(baseProduct)
          .eq('id', editingProduct.id)
          .select()
          .single();
        
        if (productError) throw productError;

        // Sync variants - delete old ones first
        await supabase.from('product_variants').delete().eq('product_id', editingProduct.id);
        
        // Insert new variants
        const { error: variantError } = await supabase.from('product_variants').insert(
          variants.map(v => ({ 
            name: v.name,
            sku: v.sku,
            price: v.price,
            stock: v.stock,
            product_id: updatedProduct.id 
          }))
        );
        if (variantError) throw variantError;

        toast({ title: 'Product Updated', description: 'Your product has been updated.' });
      } else {
        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert({ ...baseProduct, status: 'approved' })
          .select()
          .single();

        if (productError) throw productError;

        const { error: variantError } = await supabase.from('product_variants').insert(
          variants.map(v => ({ 
            name: v.name,
            sku: v.sku,
            price: v.price,
            stock: v.stock,
            product_id: newProduct.id 
          }))
        );
        if (variantError) throw variantError;

        toast({ title: 'Product Added', description: 'Your product has been added.' });
      }

      setShowForm(false);
      setEditingProduct(null);
      form.reset(emptyFormValues);
      fetchInitialData();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({ title: 'Error', description: `Failed to save product: ${(error as Error).message}`, variant: 'destructive' });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      description: product.description,
      category: product.category,
      image_url: product.image_url,
      temple_id: product.temple_id || vendorTemple?.id || '',
      variants: product.variants.length > 0 ? product.variants.map(v => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        price: v.price,
        stock: v.stock,
      })) : [emptyFormValues.variants[0]],
    });
    setShowForm(true);
  };

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

  const openAddForm = () => {
    if (!vendorTemple) {
      toast({ title: 'Cannot Add Product', description: 'You must create your temple before adding products.', variant: 'destructive' });
      return;
    }
    setEditingProduct(null);
    form.reset({ ...emptyFormValues, temple_id: vendorTemple.id });
    setShowForm(true);
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
                      LKR {Number(product.price).toLocaleString()} | Stock: {product.stock}
                       {product.variants.length > 1 && ` | ${product.variants.length} variants`}
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
        <DialogContent className="rounded-lg sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Update product details for' : 'Add a new product for'} <strong>{vendorTemple?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-2">
              <div className="md:col-span-2 space-y-4">
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
                
                <div ref={variantSectionRef} className="space-y-4 rounded-lg border p-4">
                  <div className='flex items-center justify-between'>
                     <h3 className="flex items-center font-medium">
                       <GitCommitHorizontal className="mr-2 h-4 w-4" /> Product Variants
                     </h3>
                     <Button 
                       type="button" 
                       size='sm' 
                       variant='outline' 
                       onClick={() => {
                         append({ name: '', price: 0, stock: 0, sku: '' });
                         scrollToVariants();
                       }}
                     >
                        <Plus className='mr-2 h-3 w-3' /> Add Variant
                     </Button>
                  </div>
                  {fields.map((field, index) => (
                    <motion.div 
                      key={field.id} 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3 rounded-md border p-3 relative"
                    >
                       {fields.length > 1 && (
                         <Button
                           type="button"
                           variant="ghost"
                           size="icon"
                           className="absolute top-2 right-2 h-6 w-6"
                           onClick={() => remove(index)}
                         >
                           <X className="h-4 w-4 text-destructive" />
                         </Button>
                       )}
                       <FormField
                         control={form.control}
                         name={`variants.${index}.name`}
                         render={({ field }) => (
                           <FormItem>
                             <FormLabel>Variant Name</FormLabel>
                             <FormControl><Input placeholder="e.g., Small, Blue, 500g" {...field} /></FormControl>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                       <div className="grid grid-cols-3 gap-4">
                         <FormField
                           control={form.control}
                           name={`variants.${index}.sku`}
                           render={({ field }) => (
                             <FormItem>
                               <FormLabel>SKU</FormLabel>
                               <FormControl><Input placeholder="SKU-001" {...field} value={field.value ?? ''} /></FormControl>
                               <FormMessage />
                             </FormItem>
                           )}
                         />
                         <FormField
                           control={form.control}
                           name={`variants.${index}.price`}
                           render={({ field }) => (
                             <FormItem>
                               <FormLabel>Price (LKR)</FormLabel>
                               <FormControl><Input type="number" min="0" placeholder="0" {...field} /></FormControl>
                               <FormMessage />
                             </FormItem>
                           )}
                         />
                         <FormField
                           control={form.control}
                           name={`variants.${index}.stock`}
                           render={({ field }) => (
                             <FormItem>
                               <FormLabel>Stock</FormLabel>
                               <FormControl><Input type="number" min="0" placeholder="0" {...field} /></FormControl>
                               <FormMessage />
                             </FormItem>
                           )}
                         />
                       </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <ProductImageUpload
                  currentImageUrl={form.watch('image_url')}
                  onImageUploaded={(url) => form.setValue('image_url', url)}
                  onImageRemoved={() => form.setValue('image_url', null)}
                />
              </div>

              <DialogFooter className="md:col-span-3">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

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
