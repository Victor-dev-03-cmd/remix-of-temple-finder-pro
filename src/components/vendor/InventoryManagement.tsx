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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PlusCircle, FileDown, FileUp, Search, Package, TrendingDown, LayoutGrid, MoreHorizontal, Trash2, Pencil, ChevronDown, ChevronUp, History, AlertTriangle, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';

interface ProductVariant {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  price: number;
  product_id: string;
  type?: string;
  low_stock_threshold?: number;
}

interface InventoryLog {
  id: string;
  change_amount: number;
  reason: string;
  notes: string | null;
  created_at: string;
  variant_id: string | null;
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
  
  // Stock Adjustment State
  const [adjustStockOpen, setAdjustStockOpen] = useState(false);
  const [selectedVariantForAdjust, setSelectedVariantForAdjust] = useState<ProductVariant | null>(null);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<Product | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('restock');
  const [adjustmentNotes, setAdjustmentNotes] = useState<string>('');

  // History State
  const [historyOpen, setHistoryOpen] = useState(false);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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

  const outOfStockProducts = useMemo(() => {
    if (!products) return [];
    // Check both product stock and variant stock
    return products.filter(p => {
      const variants = productVariants[p.id] || [];
      if (variants.length > 0) {
        return variants.some(v => v.stock === 0);
      }
      return p.stock === 0;
    });
  }, [products, productVariants]);

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

  // Stock Adjustment Logic
  const openAdjustStock = (product: Product, variant?: ProductVariant) => {
    setSelectedProductForAdjust(product);
    setSelectedVariantForAdjust(variant || null);
    setAdjustmentAmount(0);
    setAdjustmentReason('restock');
    setAdjustmentNotes('');
    setAdjustStockOpen(true);
  };

  const handleStockAdjustment = async () => {
    if (!user?.id || !selectedProductForAdjust) return;
    if (adjustmentAmount === 0) {
      toast({ title: "Invalid Amount", description: "Please enter a non-zero amount.", variant: "destructive" });
      return;
    }

    try {
      const change = adjustmentAmount;
      
      // 1. Update Stock
      if (selectedVariantForAdjust) {
        const newStock = Math.max(0, selectedVariantForAdjust.stock + change);
        await supabase.from('product_variants').update({ stock: newStock }).eq('id', selectedVariantForAdjust.id);
        
        // Update local state
        setProductVariants(prev => ({
          ...prev,
          [selectedProductForAdjust.id]: prev[selectedProductForAdjust.id].map(v => 
            v.id === selectedVariantForAdjust.id ? { ...v, stock: newStock } : v
          )
        }));
      } else {
        const newStock = Math.max(0, (selectedProductForAdjust.stock || 0) + change);
        await updateProduct({ id: selectedProductForAdjust.id, stock: newStock });
      }

      // 2. Log History (If table exists)
      const { error: logError } = await supabase.from('inventory_logs').insert({
        product_id: selectedProductForAdjust.id,
        variant_id: selectedVariantForAdjust?.id || null,
        vendor_id: user.id,
        change_amount: change,
        reason: adjustmentReason,
        notes: adjustmentNotes,
        created_by: user.id
      });

      if (logError) console.warn("Failed to log inventory change", logError);

      toast({ title: "Stock Updated", description: `Stock ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change)}.` });
      setAdjustStockOpen(false);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to update stock.", variant: "destructive" });
    }
  };

  // History Logic
  const openHistory = async (product: Product, variant?: ProductVariant) => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    setInventoryLogs([]);
    
    try {
      let query = supabase
        .from('inventory_logs')
        .select('*')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false });
        
      if (variant) {
        query = query.eq('variant_id', variant.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setInventoryLogs(data || []);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to load history.", variant: "destructive" });
    } finally {
      setHistoryLoading(false);
    }
  };

  // Export Logic
  const handleExport = () => {
    if (!products) return;
    
    const csvRows = [
      ['Product Name', 'Category', 'Variant', 'SKU', 'Price', 'Stock']
    ];

    products.forEach(product => {
      const variants = productVariants[product.id] || [];
      if (variants.length > 0) {
        variants.forEach(v => {
          csvRows.push([
            `"${product.name}"`,
            product.category,
            `"${v.name}"`,
            v.sku || '',
            v.price.toString(),
            v.stock.toString()
          ]);
        });
      } else {
        csvRows.push([
          `"${product.name}"`,
          product.category,
          '-',
          '',
          product.price.toString(),
          product.stock.toString()
        ]);
      }
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventory_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
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
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{outOfStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">Items needing restock</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{[...new Set(products?.map(p => p.category))].length}</div>
            <p className="text-xs text-muted-foreground">Active product categories</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>Track stock levels, adjust inventory, and view history.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => toast({ title: "Coming Soon", description: "Import feature will be available soon." })}>
                <FileUp className="mr-2 h-4 w-4" /> Import
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <FileDown className="mr-2 h-4 w-4" /> Export Report
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-2 mb-4">
            <div className="relative w-full md:w-1/3">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, SKU..."
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
                  <TableHead className="text-center">Stock Level</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const variants = productVariants[product.id] || [];
                  const hasVariants = variants.length > 0;
                  const isExpanded = expandedProducts.has(product.id);
                  const totalStock = getTotalStock(product);
                  const isLowStock = totalStock < 10; // Threshold
                  
                  return (
                    <>
                      <TableRow key={product.id} className={totalStock === 0 ? 'bg-muted/30' : ''}>
                        <TableCell>
                          {hasVariants && (
                            <button 
                              onClick={() => toggleExpanded(product.id)}
                              className="p-1 hover:bg-muted rounded transition-colors"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {product.name}
                          {hasVariants && <Badge variant="secondary" className="ml-2 text-[10px]">{variants.length} Variants</Badge>}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs font-mono">
                          {hasVariants ? 'Mixed' : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right">LKR {(product.price || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-center">
                          <span className={`font-bold ${totalStock === 0 ? 'text-destructive' : isLowStock ? 'text-orange-500' : 'text-green-600'}`}>
                            {totalStock}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {totalStock === 0 ? (
                            <Badge variant="destructive">Out of Stock</Badge>
                          ) : isLowStock ? (
                            <Badge variant="outline" className="border-orange-500 text-orange-500">Low Stock</Badge>
                          ) : (
                            <Badge variant="outline" className="border-green-500 text-green-600">In Stock</Badge>
                          )}
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
                              <DropdownMenuItem onClick={() => openAdjustStock(product)}>
                                <TrendingDown className="mr-2 h-4 w-4" /> Adjust Stock
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openHistory(product)}>
                                <History className="mr-2 h-4 w-4" /> View History
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEdit(product)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(product)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      {/* Variant Rows */}
                      {isExpanded && variants.map((variant) => {
                        const isVariantLow = variant.stock < (variant.low_stock_threshold || 5);
                        return (
                          <TableRow key={variant.id} className="bg-muted/20 border-l-4 border-l-primary/20">
                            <TableCell></TableCell>
                            <TableCell className="pl-8 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">↳</span>
                                <span className="font-medium">{variant.name}</span>
                                {variant.type && <Badge variant="outline" className="text-[10px] h-4 px-1">{variant.type}</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {variant.sku || '-'}
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-right text-sm">
                              {variant.price > 0 ? `LKR ${variant.price.toLocaleString()}` : '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`font-semibold text-sm ${variant.stock === 0 ? 'text-destructive' : isVariantLow ? 'text-orange-500' : ''}`}>
                                {variant.stock}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                               {variant.stock === 0 ? (
                                <span className="text-xs text-destructive font-medium">Sold Out</span>
                              ) : isVariantLow ? (
                                <span className="text-xs text-orange-500 font-medium">Low</span>
                              ) : (
                                <span className="text-xs text-green-600 font-medium">OK</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6" title="Adjust Stock" onClick={() => openAdjustStock(product, variant)}>
                                  <TrendingDown className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" title="History" onClick={() => openHistory(product, variant)}>
                                  <History className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
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
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{product.category}</Badge>
                          {totalStock < 10 && totalStock > 0 && <Badge variant="outline" className="text-orange-500 border-orange-500">Low Stock</Badge>}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openAdjustStock(product)}>Adjust Stock</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openHistory(product)}>View History</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEdit(product)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(product)} className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Price</p>
                        <p className="font-semibold">LKR {product.price.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Stock</p>
                        <p className={`font-semibold ${totalStock === 0 ? 'text-destructive' : ''}`}>{totalStock}</p>
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
                            {isExpanded ? 'Hide' : 'Show'} Variants
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 space-y-2">
                          {variants.map((variant) => (
                            <div key={variant.id} className="bg-muted/50 rounded-lg p-3 text-sm border-l-2 border-l-primary/30">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">{variant.name}</span>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openAdjustStock(product, variant)}><TrendingDown className="h-3 w-3" /></Button>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openHistory(product, variant)}><History className="h-3 w-3" /></Button>
                                </div>
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>SKU: {variant.sku || '-'}</span>
                                <span className={variant.stock < 5 ? 'text-orange-500 font-bold' : ''}>Stock: {variant.stock}</span>
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
              No products found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
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
                  <FormItem><FormLabel>Price (LKR)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Adjust Stock Dialog */}
      <Dialog open={adjustStockOpen} onOpenChange={setAdjustStockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>
              Update inventory for {selectedVariantForAdjust ? `${selectedProductForAdjust?.name} - ${selectedVariantForAdjust.name}` : selectedProductForAdjust?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <FormLabel className="text-right">Current</FormLabel>
              <div className="col-span-3 font-bold">
                {selectedVariantForAdjust ? selectedVariantForAdjust.stock : selectedProductForAdjust?.stock}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <FormLabel className="text-right">Adjustment</FormLabel>
              <div className="col-span-3 flex items-center gap-2">
                <Button 
                  variant="outline" size="icon" 
                  onClick={() => setAdjustmentAmount(prev => prev - 1)}
                >
                  <TrendingDown className="h-4 w-4" />
                </Button>
                <Input 
                  type="number" 
                  value={adjustmentAmount} 
                  onChange={(e) => setAdjustmentAmount(parseInt(e.target.value) || 0)}
                  className="text-center"
                />
                <Button 
                  variant="outline" size="icon"
                  onClick={() => setAdjustmentAmount(prev => prev + 1)}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <FormLabel className="text-right">Reason</FormLabel>
              <Select value={adjustmentReason} onValueChange={setAdjustmentReason}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restock">Restock (Purchase)</SelectItem>
                  <SelectItem value="sale">Manual Sale</SelectItem>
                  <SelectItem value="damage">Damaged / Expired</SelectItem>
                  <SelectItem value="return">Customer Return</SelectItem>
                  <SelectItem value="correction">Inventory Correction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <FormLabel className="text-right">Notes</FormLabel>
              <Textarea 
                className="col-span-3" 
                placeholder="Optional notes..." 
                value={adjustmentNotes}
                onChange={(e) => setAdjustmentNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustStockOpen(false)}>Cancel</Button>
            <Button onClick={handleStockAdjustment}>Update Stock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Inventory History</DialogTitle>
            <DialogDescription>
              Recent stock changes for this item.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {historyLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : inventoryLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No history found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className={`flex items-center font-bold ${log.change_amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {log.change_amount > 0 ? <ArrowUpCircle className="h-3 w-3 mr-1" /> : <ArrowDownCircle className="h-3 w-3 mr-1" />}
                          {Math.abs(log.change_amount)}
                        </span>
                      </TableCell>
                      <TableCell className="capitalize text-sm">{log.reason}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={log.notes || ''}>
                        {log.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
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