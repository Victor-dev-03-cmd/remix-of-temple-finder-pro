import { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useInventoryProducts } from '@/hooks/useInventoryProducts';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Printer, Download, Save, History, Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Skeleton } from '@/components/ui/skeleton';

// Zod schema for invoice form
const invoiceSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_phone: z.string().optional(),
  payment_mode: z.string(),
  discount: z.coerce.number().min(0).default(0),
  tax_rate: z.coerce.number().min(0).default(5),
  items: z.array(z.object({
    product_id: z.string(),
    name: z.string(),
    price: z.number(),
    quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  })).min(1, 'At least one item is required'),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

const InvoiceCreation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { products, isLoading: productsLoading, updateProduct } = useInventoryProducts(user?.id || '');
  const [productToAdd, setProductToAdd] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customer_name: '',
      customer_phone: '',
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

  const watchItems = form.watch('items');
  const watchDiscount = form.watch('discount');
  const watchTaxRate = form.watch('tax_rate');

  const subtotal = useMemo(() => 
    watchItems.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 0), 0),
  [watchItems]);

  const taxAmount = (subtotal * watchTaxRate) / 100;
  const total = subtotal + taxAmount - watchDiscount;

  const handleAddProduct = (productId: string) => {
    if (!productId) return;
    const product = products.find(p => p.id === productId);
    if (product) {
      const existingItemIndex = fields.findIndex(item => item.product_id === productId);
      if (existingItemIndex > -1) {
        const currentItem = fields[existingItemIndex];
        update(existingItemIndex, { ...currentItem, quantity: currentItem.quantity + 1 });
      } else {
        append({ product_id: product.id, name: product.name, price: product.price || 0, quantity: 1 });
      }
    }
    setProductToAdd(null); // Reset select
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

      toast({ title: "Success", description: "Invoice saved and stock updated." });
      form.reset();

    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to save invoice. Please check stock levels and try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  if (productsLoading) {
    return <Skeleton className="w-full h-96" />;
  }

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                  <div>
                      <CardTitle>Create Invoice</CardTitle>
                      <CardDescription>Generate a new invoice for a customer.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                      <Button variant="outline" disabled><History className="mr-2 h-4 w-4"/>Invoice History</Button>
                  </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid md:grid-cols-3 gap-6">
                  {/* Left: Invoice Items */}
                  <div className="md:col-span-2 space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                          <FormField name="customer_name" control={form.control} render={({ field }) => (
                            <FormItem><Label>Customer Name</Label><FormControl><Input placeholder="Enter name" {...field} /></FormControl><FormMessage/></FormItem> )}/>
                          <FormField name="customer_phone" control={form.control} render={({ field }) => (
                            <FormItem><Label>Customer Phone</Label><FormControl><Input placeholder="Optional" {...field} /></FormControl><FormMessage/></FormItem> )}/>
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
                                          {p.name} (Stock: {p.stock || 0})
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
                                  <TableHead className="w-[100px]">Quantity</TableHead>
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
                                            <Input type="number" {...field} className="h-8" /> )}/>
                                      </TableCell>
                                      <TableCell className="text-right">₹{(item.price || 0).toFixed(2)}</TableCell>
                                      <TableCell className="text-right">₹{((item.price || 0) * (form.getValues(`items.${index}.quantity`) || 0)).toFixed(2)}</TableCell>
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
                  <div className="bg-muted/30 rounded-lg p-6 space-y-4 flex flex-col">
                      <h3 className="text-lg font-semibold">Billing Summary</h3>
                      <div className="space-y-2 flex-1">
                          <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                          <div className="flex justify-between items-center">
                              <Label htmlFor="tax_rate">Tax (%)</Label>
                              <FormField name="tax_rate" control={form.control} render={({ field }) => (
                                <Input type="number" {...field} className="h-8 w-20 text-right" /> )}/>
                          </div>
                          <div className="flex justify-between"><span>Tax Amount</span><span>₹{taxAmount.toFixed(2)}</span></div>
                          <div className="flex justify-between items-center">
                            <Label htmlFor="discount">Discount (₹)</Label>
                            <FormField name="discount" control={form.control} render={({ field }) => (
                              <Input type="number" {...field} className="h-8 w-20 text-right" /> )}/>
                          </div>
                          <hr className="my-2"/>
                          <div className="flex justify-between text-lg font-bold"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
                          <FormField name="payment_mode" control={form.control} render={({ field }) => (
                            <FormItem className="space-y-2 pt-4"><Label>Payment Mode</Label>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                <SelectContent>
                                  <SelectItem value="Cash">Cash</SelectItem>
                                  <SelectItem value="UPI">UPI</SelectItem>
                                  <SelectItem value="Card">Card</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem> )}/>
                      </div>
                      <div className="space-y-2">
                         <Button size="lg" type="submit" className="w-full" disabled={isSaving || watchItems.length === 0}>
                              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
                              Save Invoice
                          </Button>
                          <div className="grid grid-cols-2 gap-2">
                              <Button variant="outline" disabled><Printer className="mr-2 h-4 w-4" /> Print</Button>
                              <Button variant="outline" disabled><Download className="mr-2 h-4 w-4" /> Download</Button>
                          </div>
                      </div>
                  </div>
                </form>
              </Form>
            </CardContent>
        </Card>
    </div>
  )
}

export default InvoiceCreation;
