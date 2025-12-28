import { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useInventoryProducts } from '@/hooks/useInventoryProducts';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Printer, Download, Save, History, Loader2, Search, RefreshCw, PlusCircle, Eye, Minus, Plus } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

const useSavedInvoices = (vendorId: string | undefined) => {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const fetchInvoices = async () => {
        if (!vendorId) return;
        setIsLoading(true);
        const { data } = await supabase.from('invoices').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false });
        setInvoices(data || []);
        setIsLoading(false);
    }

    useEffect(() => {
        fetchInvoices();
    }, [vendorId]);

    return { invoices, isLoading, refreshInvoices: fetchInvoices };
}


const InvoiceCreation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const location = useLocation();
  const { products, isLoading: productsLoading, updateProduct } = useInventoryProducts(user?.id || '');
  const { invoices, isLoading: invoicesLoading, refreshInvoices } = useSavedInvoices(user?.id);
  
  const [productToAdd, setProductToAdd] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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

  const uniqueCustomers = useMemo(() => {
    const customerMap = new Map();
    invoices.forEach(invoice => {
        if (invoice.customer_name && !customerMap.has(invoice.customer_name.toLowerCase())) {
            customerMap.set(invoice.customer_name.toLowerCase(), {
                name: invoice.customer_name,
                phone: invoice.customer_phone,
                email: invoice.customer_email,
                shipping_address: invoice.customer_shipping_address,
            });
        }
    });
    return Array.from(customerMap.values());
  }, [invoices]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const customerName = searchParams.get('customer_name');
    const search = searchParams.get('search');
    
    if (customerName) {
        const customer = uniqueCustomers.find(c => c.name === customerName);
        if (customer) {
            form.setValue('customer_name', customer.name);
            form.setValue('customer_phone', customer.phone || '');
            form.setValue('customer_email', customer.email || '');
            form.setValue('customer_shipping_address', customer.shipping_address || '');
        }
        setShowCreateForm(true);
    }

    if (search) {
        setSearchTerm(search);
        if (isMobile) setShowCreateForm(false);
    }

  }, [location.search, form, isMobile, uniqueCustomers]);

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

  const handleCustomerSelect = (customerName: string) => {
    const customer = uniqueCustomers.find(c => c.name === customerName);
    if (customer) {
        form.setValue('customer_name', customer.name);
        form.setValue('customer_phone', customer.phone || '');
        form.setValue('customer_email', customer.email || '');
        form.setValue('customer_shipping_address', customer.shipping_address || '');
    }
  };

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
        const { data, error } = await supabase.from('invoices').insert({
            vendor_id: user.id,
            customer_name: values.customer_name,
            customer_phone: values.customer_phone,
            customer_email: values.customer_email,
            customer_shipping_address: values.customer_shipping_address,
            payment_mode: values.payment_mode,
            subtotal,
            tax_amount: taxAmount,
            discount: values.discount,
            total,
            items: values.items.map(({ stock, ...item }) => item) 
        }).select();

      if(error) throw error;

      const stockUpdatePromises = values.items.map(item => {
        const product = products.find(p => p.id === item.product_id);
        if (!product) throw new Error(`Product with id ${item.product_id} not found`);
        const newStock = (product.stock || 0) - item.quantity;
        return updateProduct({ id: product.id, stock: newStock });
      });

      await Promise.all(stockUpdatePromises);

      toast({ title: "Success", description: "Invoice saved and stock updated." });
      form.reset();
      refreshInvoices();
      if(isMobile) setShowCreateForm(false);

    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }
  
  const filteredInvoices = invoices.filter(invoice => 
    invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (invoice.id.toString().toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (productsLoading) {
    return <Skeleton className="w-full h-96" />;
  }

  return (
    <div className="space-y-6">
        {isMobile && !showCreateForm && (
            <Button onClick={() => setShowCreateForm(true)} className="w-full">
                <PlusCircle className="mr-2 h-4 w-4"/>
                Add New Invoice
            </Button>
        )}

        {(showCreateForm || !isMobile) && (
          <Card>
              <CardHeader>
                <CardTitle>Create Invoice</CardTitle>
                <CardDescription>Generate a new invoice for a customer.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <FormField name="customer_name" control={form.control} render={({ field }) => (
                                <FormItem><Label>Customer Name</Label>
                                    <FormControl>
                                        <Input {...field} placeholder="Enter or select a customer" list="customer-list" onChange={(e) => {field.onChange(e); handleCustomerSelect(e.target.value);}} />
                                    </FormControl>
                                    <datalist id="customer-list">
                                        {uniqueCustomers.map(c => <option key={c.name} value={c.name} />)}
                                    </datalist>
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
                                        <TableCell className="text-right">₹{(item.price || 0).toFixed(2)}</TableCell>
                                        <TableCell className="text-right">₹{((item.price || 0) * (watchItems[index]?.quantity || 0)).toFixed(2)}</TableCell>
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
                            <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between items-center">
                                <Label htmlFor="tax_rate" className="text-sm">Tax (%)</Label>
                                <FormField name="tax_rate" control={form.control} render={({ field }) => (
                                  <Input type="number" {...field} className="h-8 w-20 text-right" /> )}/>
                            </div>
                            <div className="flex justify-between"><span>Tax Amount</span><span>₹{taxAmount.toFixed(2)}</span></div>
                            <div className="flex justify-between items-center">
                              <Label htmlFor="discount" className="text-sm">Discount (₹)</Label>
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
                        <div className="space-y-2 pt-2">
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
        )}

        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <CardTitle>Saved Invoices</CardTitle>
                        <CardDescription>View and manage your past invoices.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative w-full md:w-auto">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by name or ID..." 
                                className="pl-8 w-full md:w-64"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="icon" onClick={refreshInvoices} disabled={invoicesLoading}>
                            <RefreshCw className={`h-4 w-4 ${invoicesLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="hidden md:table-cell">Invoice ID</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead className="hidden sm:table-cell">Date</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoicesLoading ? (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                            ) : filteredInvoices.length > 0 ? (
                                filteredInvoices.map(invoice => (
                                    <TableRow key={invoice.id}>
                                        <TableCell className="hidden md:table-cell font-mono text-xs">{invoice.id.slice(0, 8)}...</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{invoice.customer_name}</div>
                                            <div className="text-sm text-muted-foreground md:hidden">{new Date(invoice.created_at).toLocaleDateString()}</div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">{new Date(invoice.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">₹{invoice.total.toFixed(2)}</TableCell>
                                        <TableCell className="text-center">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="icon" className="h-8 w-8"><Eye className="h-4 w-4"/></Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-3xl">
                                                    <DialogHeader>
                                                        <DialogTitle>Invoice Details</DialogTitle>
                                                        <p className="text-sm text-muted-foreground">Invoice ID: {invoice.id}</p>
                                                    </DialogHeader>
                                                    <div className="grid gap-4 py-4">
                                                        <p><strong>Customer:</strong> {invoice.customer_name}</p>
                                                        <p><strong>Date:</strong> {new Date(invoice.created_at).toLocaleString()}</p>
                                                        <Table>
                                                            <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Qty</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                                                            <TableBody>
                                                                {invoice.items.map((item:any) => (
                                                                    <TableRow key={item.product_id}>
                                                                        <TableCell>{item.name}</TableCell>
                                                                        <TableCell>{item.quantity}</TableCell>
                                                                        <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                                                                        <TableCell className="text-right">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                        <div className="flex justify-end">
                                                            <div className="w-full max-w-xs space-y-2">
                                                                <div className="flex justify-between"><span>Subtotal</span><span>₹{invoice.subtotal.toFixed(2)}</span></div>
                                                                <div className="flex justify-between"><span>Tax</span><span>₹{invoice.tax_amount.toFixed(2)}</span></div>
                                                                <div className="flex justify-between"><span>Discount</span><span>- ₹{invoice.discount.toFixed(2)}</span></div>
                                                                <hr/>
                                                                <div className="flex justify-between font-bold"><span>Total</span><span>₹{invoice.total.toFixed(2)}</span></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">No invoices found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    </div>
  )
}

export default InvoiceCreation;
