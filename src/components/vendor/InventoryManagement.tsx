import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useInventoryProducts, Product, NewProduct } from '@/hooks/useInventoryProducts';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PlusCircle, FileDown, Search, Package, TrendingDown, LayoutGrid, MoreHorizontal, Trash2, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ProductVariant {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  price: number;
  product_id: string;
}

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  stock: z.coerce.number().int().min(0, 'Stock must be a positive number'),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
});

const categories = ['Pooja Kits', 'Incense', 'Decor', 'Holy Water', 'Accessories', 'Books'];

const InventoryManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    products, 
    isLoading, 
    isError, 
    addProduct, 
    updateProduct, 
    deleteProduct 
  } = useInventoryProducts(user?.id || '');

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [productVariants, setProductVariants] = useState<Record<string, ProductVariant[]>>({});

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      stock: 0,
      price: 0,
    },
  });

  // Fetch variants for all products
  useEffect(() => {
    const fetchAllVariants = async () => {
      if (!products || products.length === 0) return;
      
      const productIds = products.map(p => p.id);
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .in('product_id', productIds);
      
      if (!error && data) {
        const variantMap: Record<string, ProductVariant[]> = {};
        data.forEach(variant => {
          if (!variantMap[variant.product_id]) {
            variantMap[variant.product_id] = [];
          }
          variantMap[variant.product_id].push(variant);
        });
        setProductVariants(variantMap);
      }
    };
    
    fetchAllVariants();
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(p => categoryFilter === 'all' || p.category === categoryFilter);
  }, [products, searchTerm, categoryFilter]);

  const outOfStockProducts = useMemo(() => products?.filter(p => (p.stock || 0) === 0) || [], [products]);

  const toggleExpanded = (productId: string) => {
    setExpandedProducts(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const getTotalStock = (product: Product) => {
    const variants = productVariants[product.id] || [];
    if (variants.length > 0) {
      return variants.reduce((sum, v) => sum + v.stock, 0);
    }
    return product.stock;
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    form.reset({
      name: '',
      description: '',
      category: '',
      stock: 0,
      price: 0,
    });
    setDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      id: product.id,
      name: product.name,
      description: product.description || '',
      category: product.category,
      stock: product.stock,
      price: product.price,
    });
    setDialogOpen(true);
  };

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete.id);
      toast({ title: 'Success', description: 'Product deleted successfully.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete product.', variant: 'destructive' });
    } finally {
      setProductToDelete(null);
    }
  };
  
  async function onSubmit(values: z.infer<typeof productSchema>) {
    if (!user?.id) return;
    
    try {
      if (editingProduct) {
        await updateProduct({ 
          id: editingProduct.id, 
          ...values
        });
        toast({ title: 'Success', description: 'Product updated successfully.' });
      } else {
        await addProduct({
          vendor_id: user.id,
          ...values
        } as NewProduct);
        toast({ title: 'Success', description: 'Product added successfully.' });
      }
      setDialogOpen(false);
      setEditingProduct(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save product.', variant: 'destructive' });
    }
  }
  
  if (isLoading) {
    return <Skeleton className="w-full h-96" />;
  }

  if (isError) {
    return <div className="text-center p-8 text-destructive">Failed to load inventory. Please try again.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Total unique items in inventory</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{outOfStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">Items with zero stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{[...new Set(products?.map(p => p.category))].length}</div>
            <p className="text-xs text-muted-foreground">Total product categories</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Inventory</CardTitle>
              <CardDescription>Manage your products, variants, and stock levels.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Product
              </Button>
              <Button variant="outline" disabled>
                <FileDown className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-2 mb-4">
            <div className="relative w-full md:w-1/3">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                className="pl-8"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-center">Variants</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const variants = productVariants[product.id] || [];
                  const hasVariants = variants.length > 0;
                  const isExpanded = expandedProducts.has(product.id);
                  const totalStock = getTotalStock(product);
                  
                  return (
                    <>
                      <TableRow key={product.id} className={totalStock === 0 ? 'bg-muted/50 text-muted-foreground' : ''}>
                        <TableCell>
                          {hasVariants && (
                            <button 
                              onClick={() => toggleExpanded(product.id)}
                              className="p-1 hover:bg-muted rounded"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-muted-foreground text-xs font-mono">
                          {hasVariants ? '(see variants)' : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right">₹{(product.price || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          {totalStock === 0 ? (
                            <Badge variant="destructive">SOLD OUT</Badge>
                          ) : (
                            <span className={`font-bold ${totalStock < 10 ? 'text-destructive' : ''}`}>
                              {totalStock}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{variants.length}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(product)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(product)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      {/* Variant Rows */}
                      {isExpanded && variants.map((variant) => (
                        <TableRow key={variant.id} className="bg-muted/30 border-l-4 border-l-primary/30">
                          <TableCell></TableCell>
                          <TableCell className="pl-8 text-sm text-muted-foreground">
                            ↳ {variant.name}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {variant.sku || '-'}
                          </TableCell>
                          <TableCell></TableCell>
                          <TableCell className="text-right text-sm">₹{variant.price.toFixed(2)}</TableCell>
                          <TableCell className="text-center">
                            <span className={`font-semibold text-sm ${variant.stock < 5 ? 'text-destructive' : ''}`}>
                              {variant.stock}
                            </span>
                          </TableCell>
                          <TableCell></TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      ))}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredProducts.map((product) => {
              const variants = productVariants[product.id] || [];
              const hasVariants = variants.length > 0;
              const isExpanded = expandedProducts.has(product.id);
              const totalStock = getTotalStock(product);
              
              return (
                <Card key={product.id} className={totalStock === 0 ? 'bg-muted/50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{product.name}</h4>
                        <Badge variant="outline" className="mt-1">{product.category}</Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(product)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(product)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Price</p>
                        <p className="font-semibold">₹{product.price.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Stock</p>
                        {totalStock === 0 ? (
                          <Badge variant="destructive" className="text-xs">Sold Out</Badge>
                        ) : (
                          <p className={`font-semibold ${totalStock < 10 ? 'text-destructive' : ''}`}>{totalStock}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Variants</p>
                        <p className="font-semibold">{variants.length}</p>
                      </div>
                    </div>

                    {hasVariants && (
                      <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(product.id)}>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-full mt-3 text-xs">
                            {isExpanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                            {isExpanded ? 'Hide' : 'Show'} Variants ({variants.length})
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 space-y-2">
                          {variants.map((variant) => (
                            <div key={variant.id} className="bg-muted/50 rounded-lg p-3 text-sm border-l-2 border-l-primary/30">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{variant.name}</p>
                                  {variant.sku && (
                                    <p className="text-xs text-muted-foreground font-mono">SKU: {variant.sku}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">₹{variant.price.toFixed(2)}</p>
                                  <p className={`text-xs ${variant.stock < 5 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                    Stock: {variant.stock}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">
              No products found.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
              <FormField name="name" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="description" control={form.control} render={({ field }) => (
                 <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="category" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                    <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField name="stock" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Stock</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="price" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Price (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="submit">Save Product</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product '{productToDelete?.name}' and remove its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InventoryManagement;