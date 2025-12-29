import { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useInventoryProducts } from '@/hooks/useInventoryProducts';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Printer, Download, Save, Loader2, PlusCircle, Minus, Plus } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { Textarea } from '@/components/ui/textarea';

const invoiceSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_phone: z.string().optional(),
  customer_email: z.string().optional(),
  customer_shipping_address: z.string().optional(),
  payment_mode: z.string(),
  discount: z.coerce.number().min(0).default(0),
  tax_rate: z.coerce.number().min(0).default(5),
  items: z.array(z.object({
    product_id: z.string(),
    name: z.string(),
    price: z.number(),
    quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
    stock: z.number(),
  })).min(1, 'At least one item is required'),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

const InvoiceCreation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const location = useLocation();
  const { products, isLoading: productsLoading, updateProduct } = useInventoryProducts(user?.id || '');
  
  const [productToAdd, setProductToAdd] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(!isMobile);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      customer_shipping_address: '',
      payment_mode: 'Cash',
      discount: 0,
      tax_rate: 5,
      items: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if(!location.search) {
      setShowCreateForm(!isMobile);
    }
  }, [isMobile, location.search]);

  const watchItems = form.watch('items');
  const watchDiscount = form.watch('discount');
  const watchTaxRate = form.watch('tax_rate');

  const subtotal = watchItems.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 0), 0);
  const taxAmount = (subtotal * watchTaxRate) / 100;
  const total = subtotal + taxAmount - watchDiscount;

  const handleAddProduct = (productId: string) => {
    if (!productId) return;
    const product = products.find(p => p.id === productId);
    if (product) {
      if ((product.stock || 0) <= 0) {
        toast({ title: "Out of Stock", description: "This product is currently out of stock.", variant: "destructive" });
        return;
      }

      const existingItemIndex = fields.findIndex(item => item.product_id === productId);
      if (existingItemIndex > -1) {
        const currentItem = fields[existingItemIndex];
        if (currentItem.quantity < currentItem.stock) {
          update(existingItemIndex, { ...currentItem, quantity: currentItem.quantity + 1 });
        } else {
          toast({ title: "Stock Limit Reached", description: "You cannot add more than the available stock.", variant: "destructive" });
        }
      } else {
        append({ product_id: product.id, name: product.name, price: product.price || 0, quantity: 1, stock: product.stock || 0 });
      }
    }
    setProductToAdd(null); 
  };

  async function onSubmit(values: InvoiceFormValues) {
    if (!user) return;
    setIsSaving(true);

    try {
      // Update stock for each product
      const stockUpdatePromises = values.items.map(item => {
        const product = products.find(p => p.id === item.product_id);
        if (!product) throw new Error(`Product with id ${item.product_id} not found`);
        const newStock = (product.stock || 0) - item.quantity;
        return updateProduct({ id: product.id, stock: newStock });
      });

      await Promise.all(stockUpdatePromises);

      toast({ title: "Success", description: "Invoice processed and stock updated." });
      form.reset();
      if(isMobile) setShowCreateForm(false);

    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  const handlePrint = () => {
    window.print();
  };

  if (productsLoading) {
    return <Skeleton className="w-full h-96" />;
  }

  return (
    <div className="space-y-6">
      {isMobile && !showCreateForm && (
        <Button onClick={() => setShowCreateForm(true)} className="w-full">
          <PlusCircle className="mr-2 h-4 w-4"/>
          Create New Invoice
        </Button>
      )}

      {(showCreateForm || !isMobile) && (
        <Card>
          <CardHeader>
            <CardTitle>Create Invoice</CardTitle>
            <CardDescription>Generate a new invoice for a customer. Stock will be updated automatically.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField name="customer_name" control={form.control} render={({ field }) => (
                      <FormItem><Label>Customer Name</Label>
                        <FormControl>
                          <Input {...field} placeholder="Enter customer name" />
                        </FormControl>
                        <FormMessage/>
                      </FormItem> 
                    )}/>
                    <FormField name="customer_phone" control={form.control} render={({ field }) => (
                      <FormItem><Label>Customer Phone</Label><FormControl><Input placeholder="Optional" {...field} /></FormControl><FormMessage/></FormItem> )}/>
                    <FormField name="customer_email" control={form.control} render={({ field }) => (
                      <FormItem><Label>Customer Email</Label><FormControl><Input placeholder="Optional" {...field} /></FormControl><FormMessage/></FormItem> )}/>
                    <FormField name="customer_shipping_address" control={form.control} render={({ field }) => (
                      <FormItem><Label>Shipping Address</Label><FormControl><Textarea placeholder="Optional" {...field} /></FormControl><FormMessage/></FormItem> )}/>
                  </div>
                  <div className="space-y-2">
                    <Label>Add Products</Label>
                    <Select onValueChange={handleAddProduct} value={productToAdd || ''}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product to add..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id} disabled={(p.stock || 0) <= 0}>
                            {p.name} - 
                            {(p.stock || 0) > 0 ? 
                              <span className="text-muted-foreground"> (Stock: {p.stock})</span> : 
                              <span className="text-red-500"> SOLD OUT</span>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.items?.message && <p className="text-sm font-medium text-destructive">{form.formState.errors.items.message}</p>}
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="w-[150px]">Quantity</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.length > 0 ? fields.map((item, index) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>
                              <FormField name={`items.${index}.quantity`} control={form.control} render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <div className="flex items-center justify-center space-x-2">
                                      <Button type="button" variant="outline" size="icon" className="h-8 w-8" 
                                        onClick={() => form.setValue(`items.${index}.quantity`, Math.max(1, field.value - 1))}>
                                        <Minus className="h-4 w-4" />
                                      </Button>
                                      <span className="font-medium text-center w-8">{field.value}</span>
                                      <Button type="button" variant="outline" size="icon" className="h-8 w-8" 
                                        onClick={() => field.value < item.stock ? form.setValue(`items.${index}.quantity`, field.value + 1) : toast({title: 'Stock limit reached', variant: 'destructive'})}>
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}/>
                            </TableCell>
                            <TableCell className="text-right">LKR {(item.price || 0).toFixed(2)}</TableCell>
                            <TableCell className="text-right">LKR {((item.price || 0) * (watchItems[index]?.quantity || 0)).toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                              No products added yet.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Right: Billing Summary */}
                <div className="bg-muted/30 rounded-lg p-4 md:p-6 space-y-4 flex flex-col">
                  <h3 className="text-lg font-semibold">Billing Summary</h3>
                  <div className="space-y-2 flex-1">
                    <div className="flex justify-between"><span>Subtotal</span><span>LKR {subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between items-center">
                      <Label htmlFor="tax_rate" className="text-sm">Tax (%)</Label>
                      <FormField name="tax_rate" control={form.control} render={({ field }) => (
                        <Input type="number" {...field} className="h-8 w-20 text-right" /> )}/>
                    </div>
                    <div className="flex justify-between"><span>Tax Amount</span><span>LKR {taxAmount.toFixed(2)}</span></div>
                    <div className="flex justify-between items-center">
                      <Label htmlFor="discount" className="text-sm">Discount (LKR)</Label>
                      <FormField name="discount" control={form.control} render={({ field }) => (
                        <Input type="number" {...field} className="h-8 w-20 text-right" /> )}/>
                    </div>
                    <hr className="my-2"/>
                    <div className="flex justify-between text-lg font-bold"><span>Total</span><span>LKR {total.toFixed(2)}</span></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="payment_mode" className="text-sm">Payment Mode</Label>
                    <FormField name="payment_mode" control={form.control} render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Card">Card</SelectItem>
                          <SelectItem value="Bank Transfer">Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    )}/>
                  </div>
                  <div className="flex flex-col gap-2 pt-4">
                    <Button type="submit" disabled={isSaving || fields.length === 0}>
                      {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                      Save Invoice
                    </Button>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" className="flex-1" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4"/>Print
                      </Button>
                      <Button type="button" variant="outline" className="flex-1">
                        <Download className="mr-2 h-4 w-4"/>PDF
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InvoiceCreation;
