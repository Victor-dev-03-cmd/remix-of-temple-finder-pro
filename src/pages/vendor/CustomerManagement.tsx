import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, User, Phone, Calendar, PlusCircle, FileText, ShoppingBag, Mail, Home } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';


interface Customer {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  shipping_address?: string;
  lastOrder?: string;
  products?: string[];
}

const AddCustomerForm = ({ vendorId, onCustomerAdd, setOpen }: { vendorId: string, onCustomerAdd: (customer: Customer, createInvoice: boolean) => void, setOpen: (open: boolean) => void }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [shippingAddress, setShippingAddress] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const handleSave = async (createInvoice: boolean) => {
        if (!name) {
            toast({ title: "Name is required", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        try {
            const { data, error } = await supabase.from('customers').insert({ vendor_id: vendorId, name, phone, email, shipping_address: shippingAddress }).select();
            if(error) throw error;
            toast({ title: "Success", description: "Customer added successfully." });
            onCustomerAdd(data[0], createInvoice);
            setOpen(false);
        } catch(e) {
            console.error(e);
            toast({ title: "Error adding customer", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="customer-name">Customer Name</Label>
                <Input id="customer-name" placeholder="Enter customer's name" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="customer-phone">Phone</Label>
                    <Input id="customer-phone" placeholder="Enter phone number" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="customer-email">Email (Optional)</Label>
                    <Input id="customer-email" type="email" placeholder="Enter email address" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="shipping-address">Shipping Address (Optional)</Label>
                <Textarea id="shipping-address" placeholder="Enter shipping address" value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} />
            </div>
            <DialogFooter className="gap-2 sm:justify-end">
                 <Button variant="outline" onClick={() => handleSave(false)} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Add Customer
                </Button>
                <Button onClick={() => handleSave(true)} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Add and Create Invoice
                </Button>
            </DialogFooter>
        </div>
    );
}

const CustomerManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddCustomerOpen, setAddCustomerOpen] = useState(false);
  const isMobile = useIsMobile();

  const fetchCustomers = async () => {
      if (!user) return;
      setIsLoading(true);

      const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('vendor_id', user.id);

      const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .select('customer_name, customer_phone, created_at, items')
          .eq('vendor_id', user.id)
          .order('created_at', { ascending: true });

      if (customerError || invoiceError) {
          console.error('Error fetching data:', customerError || invoiceError);
      } else {
          const combinedCustomers = new Map<string, Customer>();

          // Process standalone customers first
          customerData.forEach(c => {
              const key = c.phone || c.name;
              combinedCustomers.set(key, { ...c, products: [], lastOrder: 'N/A' });
          });

          // Process invoices and update or add customer info
          invoiceData.forEach(invoice => {
              const key = invoice.customer_phone || invoice.customer_name;
              const existingCustomer = combinedCustomers.get(key) || {
                  name: invoice.customer_name,
                  phone: invoice.customer_phone || 'N/A',
                  products: [],
              };

              const products = new Set([...(existingCustomer.products || []), ...invoice.items.map((item: any) => item.name)]);

              combinedCustomers.set(key, {
                  ...existingCustomer,
                  lastOrder: new Date(invoice.created_at).toLocaleDateString(),
                  products: Array.from(products),
              });
          });
          
          setCustomers(Array.from(combinedCustomers.values()).sort((a,b) => (b.lastOrder || '').localeCompare(a.lastOrder || '')));
      }

      setIsLoading(false);
  }

  useEffect(() => {
    fetchCustomers();
  }, [user]);

  const handleCustomerAdd = (customer: Customer, createInvoice: boolean) => {
      fetchCustomers(); // Refresh the list
      if (createInvoice) {
        const params = new URLSearchParams();
        params.set('customer_name', customer.name);
        if (customer.phone) params.set('customer_phone', customer.phone);
        if (customer.email) params.set('customer_email', customer.email);
        if (customer.shipping_address) params.set('customer_shipping_address', customer.shipping_address);
        navigate(`/vendor/invoices?${params.toString()}`);
      }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.phone && customer.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Card>
        <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <CardTitle>Customers</CardTitle>
                    <CardDescription>View and manage your customer list.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-full md:w-auto">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by name or phone..." 
                            className="pl-8 w-full md:w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Dialog open={isAddCustomerOpen} onOpenChange={setAddCustomerOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Add Customer
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add a New Customer</DialogTitle>
                                <DialogDescription>Create a new customer record.</DialogDescription>
                            </DialogHeader>
                            <AddCustomerForm vendorId={user?.id || ''} onCustomerAdd={handleCustomerAdd} setOpen={setAddCustomerOpen} />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            {isMobile ? (
                <div className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : filteredCustomers.length > 0 ? (
                  filteredCustomers.map(customer => (
                    <Card key={customer.id || customer.phone + customer.name} className="p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4">
                                <User className="h-6 w-6 text-muted-foreground flex-shrink-0 mt-1" />
                                <div className="flex-1 space-y-1">
                                    <p className="font-medium">{customer.name}</p>
                                    {customer.phone && <div className="flex items-center text-sm text-muted-foreground"><Phone className="h-3 w-3 mr-1.5" />{customer.phone}</div>}
                                    {customer.email && <div className="flex items-center text-sm text-muted-foreground"><Mail className="h-3 w-3 mr-1.5" />{customer.email}</div>}
                                    {customer.lastOrder && customer.lastOrder !== 'N/A' && <div className="flex items-center text-sm text-muted-foreground"><Calendar className="h-3 w-3 mr-1.5" />Last Order: {customer.lastOrder}</div>}
                                </div>
                            </div>
                             <Button variant="outline" size="sm" asChild>
                                <Link to={`/vendor/invoices?search=${customer.name}`}><FileText className="h-3 w-3" /></Link>
                            </Button>
                        </div>
                        {customer.products && customer.products.length > 0 &&
                            <div className="pt-3">
                                <h4 className="text-xs font-semibold mb-2 flex items-center"><ShoppingBag className="h-3 w-3 mr-1.5"/> Purchased Products</h4>
                                <div className="flex flex-wrap gap-1">
                                    {customer.products.slice(0, 5).map(p => <Badge key={p} variant="secondary">{p}</Badge>)}
                                    {customer.products.length > 5 && <Badge variant="outline">+{customer.products.length - 5} more</Badge>}
                                </div>
                            </div>
                        }
                    </Card>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground p-4">No customers found.</p>
                )}
              </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Shipping Address</TableHead>
                                <TableHead>Purchased Products</TableHead>
                                <TableHead className="text-center">Last Order</TableHead>
                                <TableHead className="text-right"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                            ) : filteredCustomers.length > 0 ? (
                            filteredCustomers.map(customer => (
                                <TableRow key={customer.id || customer.phone + customer.name}>
                                    <TableCell>
                                        <div className="font-medium">{customer.name}</div>
                                    </TableCell>
                                    <TableCell>
                                        {customer.phone && <div className="flex items-center text-sm"><Phone className="h-3 w-3 mr-1.5 text-muted-foreground" />{customer.phone}</div>}
                                        {customer.email && <div className="flex items-center text-sm"><Mail className="h-3 w-3 mr-1.5 text-muted-foreground" />{customer.email}</div>}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-muted-foreground">{customer.shipping_address}</div>
                                    </TableCell>
                                    <TableCell>
                                        {customer.products && customer.products.length > 0 ?
                                            <div className="flex flex-wrap gap-1 w-64">
                                                {customer.products.slice(0, 3).map(p => <Badge key={p} variant="secondary">{p}</Badge>)}
                                                {customer.products.length > 3 && <Badge variant="outline">+{customer.products.length - 3} more</Badge>}
                                            </div> : <span className="text-xs text-muted-foreground">None</span>
                                        }
                                    </TableCell>
                                    <TableCell className="text-center">{customer.lastOrder}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link to={`/vendor/invoices?search=${customer.name}`}>View Invoices</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                            ) : (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center">No customers found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
        </CardContent>
    </Card>
  );
};

export default CustomerManagement;
