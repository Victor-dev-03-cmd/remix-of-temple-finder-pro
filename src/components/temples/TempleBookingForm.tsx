import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Ticket, CheckCircle2, Plus, Minus, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Ticket categories with pricing
const TICKET_CATEGORIES = [
  { id: 'adult', label: 'Adult', description: 'Ages 18-59', price: 200 },
  { id: 'child', label: 'Child', description: 'Ages 5-17', price: 100 },
  { id: 'senior', label: 'Senior', description: 'Ages 60+', price: 150 },
  { id: 'foreign', label: 'Foreign Tourist', description: 'Non-residents', price: 500 },
  { id: 'student', label: 'Student', description: 'With valid ID', price: 75 },
];

interface TicketSelection {
  category: string;
  label: string;
  quantity: number;
  price: number;
}

const bookingSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  customerEmail: z.string().email('Please enter a valid email'),
  customerPhone: z.string().optional(),
  visitDate: z.date({ required_error: 'Please select a visit date' }),
  notes: z.string().max(500).optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface TempleBookingFormProps {
  templeId: string;
  templeName: string;
}

function generateBookingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function TempleBookingForm({ templeId, templeName }: TempleBookingFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingCode, setBookingCode] = useState('');
  const [ticketSelections, setTicketSelections] = useState<TicketSelection[]>(
    TICKET_CATEGORIES.map((cat) => ({
      category: cat.id,
      label: cat.label,
      quantity: 0,
      price: cat.price,
    }))
  );

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      notes: '',
    },
  });

  const updateTicketQuantity = (categoryId: string, delta: number) => {
    setTicketSelections((prev) =>
      prev.map((t) =>
        t.category === categoryId
          ? { ...t, quantity: Math.max(0, Math.min(20, t.quantity + delta)) }
          : t
      )
    );
  };

  const totalTickets = ticketSelections.reduce((sum, t) => sum + t.quantity, 0);
  const totalPrice = ticketSelections.reduce((sum, t) => sum + t.quantity * t.price, 0);
  const selectedTickets = ticketSelections.filter((t) => t.quantity > 0);

  const onSubmit = async (data: BookingFormData) => {
    if (totalTickets === 0) {
      toast.error('Please select at least one ticket');
      return;
    }

    setIsSubmitting(true);

    try {
      const generatedCode = generateBookingCode();
      const formattedDate = format(data.visitDate, 'yyyy-MM-dd');

      // Prepare ticket details
      const ticketDetails = selectedTickets.map((t) => ({
        category: t.category,
        label: t.label,
        quantity: t.quantity,
        price: t.price,
        subtotal: t.quantity * t.price,
      }));

      // Insert booking into database
      const { error: insertError } = await supabase
        .from('temple_bookings')
        .insert({
          temple_id: templeId,
          customer_name: data.customerName,
          customer_email: data.customerEmail,
          customer_phone: data.customerPhone || null,
          visit_date: formattedDate,
          num_tickets: totalTickets,
          booking_code: generatedCode,
          notes: data.notes || null,
          ticket_details: ticketDetails,
        });

      if (insertError) throw insertError;

      // Format ticket details for email
      const ticketSummary = selectedTickets
        .map((t) => `${t.label}: ${t.quantity} × LKR ${t.price}`)
        .join(', ');

      // Send confirmation email with QR code
      const { error: emailError } = await supabase.functions.invoke('send-booking-email', {
        body: {
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          templeName: templeName,
          visitDate: format(data.visitDate, 'MMMM d, yyyy'),
          numTickets: totalTickets,
          bookingCode: generatedCode,
          ticketDetails: ticketDetails,
          totalPrice: totalPrice,
        },
      });

      if (emailError) {
        console.error('Email error:', emailError);
        toast.warning('Booking confirmed but email could not be sent. Your booking code: ' + generatedCode);
      } else {
        toast.success('Booking confirmed! Check your email for the QR code.');
      }

      setBookingCode(generatedCode);
      setBookingSuccess(true);
    } catch (error: any) {
      console.error('Booking error:', error);
      toast.error(error.message || 'Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setBookingSuccess(false);
      setBookingCode('');
      form.reset();
      setTicketSelections(
        TICKET_CATEGORIES.map((cat) => ({
          category: cat.id,
          label: cat.label,
          quantity: 0,
          price: cat.price,
        }))
      );
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? setIsOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Ticket className="h-4 w-4" />
          Book Tickets
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {bookingSuccess ? 'Booking Confirmed!' : `Book Tickets - ${templeName}`}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {bookingSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-8 text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Thank You!</h3>
              <p className="mb-4 text-muted-foreground">
                Your booking has been confirmed. A confirmation email with your QR code has been sent.
              </p>
              <div className="mb-6 rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">Your Booking Code</p>
                <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-primary">
                  {bookingCode}
                </p>
              </div>
              <Button onClick={handleClose} className="w-full">
                Close
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Ticket Categories */}
                  <div className="space-y-3">
                    <FormLabel className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Select Tickets *
                    </FormLabel>
                    <div className="space-y-2">
                      {TICKET_CATEGORIES.map((category) => {
                        const selection = ticketSelections.find((t) => t.category === category.id);
                        const quantity = selection?.quantity || 0;
                        return (
                          <Card
                            key={category.id}
                            className={cn(
                              'transition-colors',
                              quantity > 0 && 'border-primary bg-primary/5'
                            )}
                          >
                            <CardContent className="flex items-center justify-between p-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">
                                    {category.label}
                                  </span>
                                  <Badge variant="secondary" className="text-xs">
                                    LKR {category.price}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">{category.description}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => updateTicketQuantity(category.id, -1)}
                                  disabled={quantity === 0}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-8 text-center font-semibold">{quantity}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => updateTicketQuantity(category.id, 1)}
                                  disabled={totalTickets >= 20}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Summary */}
                    {totalTickets > 0 && (
                      <div className="rounded-lg bg-muted p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Total Tickets</span>
                          <span className="font-semibold">{totalTickets}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-muted-foreground">Total Amount</span>
                          <span className="text-lg font-bold text-primary">LKR {totalPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="visitDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Visit Date *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number (Optional)</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="+94 XX XXX XXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Requests (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any special requirements or notes..."
                            className="resize-none"
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || totalTickets === 0}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Ticket className="mr-2 h-4 w-4" />
                        Confirm Booking {totalTickets > 0 && `(LKR ${totalPrice.toLocaleString()})`}
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
