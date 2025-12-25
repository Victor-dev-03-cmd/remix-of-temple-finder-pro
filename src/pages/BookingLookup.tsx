import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Ticket, Calendar, MapPin, User, Mail, Phone, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface TicketDetail {
  category: string;
  label: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface BookingDetails {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  visit_date: string;
  num_tickets: number;
  booking_code: string;
  status: string;
  notes: string | null;
  created_at: string;
  ticket_details: TicketDetail[] | null;
  temples: {
    name: string;
    district: string;
    province: string;
    address: string | null;
    image_url: string | null;
  };
}

const BookingLookup = () => {
  const [bookingCode, setBookingCode] = useState('');
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bookingCode.trim()) {
      toast.error('Please enter a booking code');
      return;
    }

    setIsLoading(true);
    setSearched(true);

    try {
      // Use secure RPC function to lookup booking by code
      const { data: bookingData, error: bookingError } = await supabase
        .rpc('get_booking_by_code', { p_booking_code: bookingCode.toUpperCase().trim() })
        .maybeSingle();

      if (bookingError) throw bookingError;

      if (!bookingData) {
        setBooking(null);
        toast.error('No booking found with this code');
        setIsLoading(false);
        return;
      }

      // Fetch temple data separately
      const { data: templeData, error: templeError } = await supabase
        .from('temples')
        .select('name, district, province, address, image_url')
        .eq('id', bookingData.temple_id)
        .maybeSingle();

      if (templeError) throw templeError;

      const data = {
        ...bookingData,
        temples: templeData || { name: 'Unknown Temple', district: '', province: '', address: null, image_url: null }
      };

      // Parse ticket_details from JSON
      const finalBooking = {
        ...data,
        ticket_details: Array.isArray(data.ticket_details) 
          ? (data.ticket_details as unknown as TicketDetail[]) 
          : null,
      };
      setBooking(finalBooking as BookingDetails);
    } catch (error: any) {
      console.error('Lookup error:', error);
      toast.error('Failed to look up booking');
      setBooking(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'confirmed':
        return {
          icon: CheckCircle2,
          label: 'Confirmed',
          color: 'text-green-600',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
        };
      case 'cancelled':
        return {
          icon: XCircle,
          label: 'Cancelled',
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          borderColor: 'border-destructive/20',
        };
      case 'completed':
        return {
          icon: Clock,
          label: 'Completed',
          color: 'text-blue-600',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
        };
      default:
        return {
          icon: Ticket,
          label: status,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          borderColor: 'border-border',
        };
    }
  };

  const generateQRUrl = (booking: BookingDetails) => {
    const qrData = encodeURIComponent(
      `TEMPLE-BOOKING:${booking.booking_code}|${booking.temples.name}|${booking.visit_date}|${booking.num_tickets}`
    );
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-2xl"
        >
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Ticket className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mb-2 font-display text-3xl font-bold text-foreground">
              Check Your Booking
            </h1>
            <p className="text-muted-foreground">
              Enter your booking code to view your temple visit details
            </p>
          </div>

          {/* Search Form */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Enter booking code (e.g., ABC12345)"
                    value={bookingCode}
                    onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                    className="pl-10 font-mono text-lg uppercase tracking-widest"
                    maxLength={8}
                  />
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Search'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          {isLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Looking up your booking...</p>
            </div>
          ) : booking ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Status Banner */}
              {(() => {
                const statusInfo = getStatusInfo(booking.status);
                const StatusIcon = statusInfo.icon;
                return (
                  <div className={`flex items-center gap-3 rounded-lg border p-4 ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
                    <StatusIcon className={`h-6 w-6 ${statusInfo.color}`} />
                    <div>
                      <p className={`font-semibold ${statusInfo.color}`}>
                        Booking {statusInfo.label}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Booked on {format(new Date(booking.created_at), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Booking Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Booking Details</span>
                    <Badge variant="outline" className="font-mono text-lg tracking-widest">
                      {booking.booking_code}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Temple Info */}
                  <div className="flex gap-4">
                    {booking.temples.image_url && (
                      <img
                        src={booking.temples.image_url}
                        alt={booking.temples.name}
                        className="h-24 w-24 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">
                        {booking.temples.name}
                      </h3>
                      <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {booking.temples.district}, {booking.temples.province}
                      </div>
                      {booking.temples.address && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {booking.temples.address}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="h-px bg-border" />

                  {/* Visit Details */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Visit Date</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-semibold">
                          {format(new Date(booking.visit_date), 'EEEE, MMMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total Tickets</p>
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{booking.num_tickets} {booking.num_tickets === 1 ? 'ticket' : 'tickets'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ticket Categories Breakdown */}
                  {booking.ticket_details && booking.ticket_details.length > 0 && (
                    <>
                      <div className="h-px bg-border" />
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-muted-foreground">Ticket Breakdown</p>
                        <div className="space-y-2">
                          {booking.ticket_details.map((ticket, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                            >
                              <div>
                                <span className="font-medium">{ticket.label}</span>
                                <span className="ml-2 text-sm text-muted-foreground">
                                  × {ticket.quantity}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-sm text-muted-foreground">
                                  LKR {ticket.price} each
                                </span>
                                <p className="font-semibold text-primary">
                                  LKR {(ticket.quantity * ticket.price).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between border-t border-border pt-3">
                          <span className="font-semibold">Total Amount</span>
                          <span className="text-lg font-bold text-primary">
                            LKR {booking.ticket_details.reduce((sum, t) => sum + t.quantity * t.price, 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="h-px bg-border" />

                  {/* Customer Info */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Visitor Information</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.customer_email}</span>
                      </div>
                      {booking.customer_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{booking.customer_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {booking.notes && (
                    <>
                      <div className="h-px bg-border" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Special Requests</p>
                        <p className="text-foreground">{booking.notes}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* QR Code Card */}
              {booking.status !== 'cancelled' && (
                <Card>
                  <CardContent className="py-6">
                    <div className="text-center">
                      <p className="mb-4 text-sm text-muted-foreground">
                        Present this QR code at the temple entrance
                      </p>
                      <img
                        src={generateQRUrl(booking)}
                        alt="Booking QR Code"
                        className="mx-auto h-48 w-48 rounded-lg border border-border"
                      />
                      <p className="mt-4 font-mono text-2xl font-bold tracking-widest text-primary">
                        {booking.booking_code}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          ) : searched ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-12 text-center"
            >
              <XCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium text-foreground">Booking Not Found</p>
              <p className="text-sm text-muted-foreground">
                Please check your booking code and try again
              </p>
            </motion.div>
          ) : null}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default BookingLookup;
