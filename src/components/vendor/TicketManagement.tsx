import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Trash2, Loader2, Ticket, ToggleLeft, ToggleRight } from 'lucide-react';
import { useTempleTickets, TempleTicket } from '@/hooks/useTempleTickets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const ticketSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  description: z.string().max(200).optional(),
  price: z.coerce.number().min(0, 'Price must be 0 or more'),
});

type TicketFormData = z.infer<typeof ticketSchema>;

interface TicketManagementProps {
  templeId: string;
}

export default function TicketManagement({ templeId }: TicketManagementProps) {
  const { tickets, loading, createTicket, updateTicket, deleteTicket, toggleTicketStatus } = useTempleTickets(templeId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TempleTicket | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
    },
  });

  const handleOpenDialog = (ticket?: TempleTicket) => {
    if (ticket) {
      setEditingTicket(ticket);
      form.reset({
        name: ticket.name,
        description: ticket.description || '',
        price: ticket.price,
      });
    } else {
      setEditingTicket(null);
      form.reset({
        name: '',
        description: '',
        price: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTicket(null);
    form.reset();
  };

  const onSubmit = async (data: TicketFormData) => {
    setIsSubmitting(true);
    try {
      if (editingTicket) {
        await updateTicket(editingTicket.id, {
          name: data.name,
          description: data.description,
          price: data.price,
        });
      } else {
        await createTicket({
          temple_id: templeId,
          name: data.name,
          description: data.description,
          price: data.price,
          display_order: tickets.length,
        });
      }
      handleCloseDialog();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (ticket: TempleTicket) => {
    await toggleTicketStatus(ticket.id, !ticket.is_active);
  };

  const handleDelete = async (ticketId: string) => {
    await deleteTicket(ticketId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Ticket Types
            </CardTitle>
            <CardDescription>
              Manage the ticket types and prices for your temple
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Ticket Type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTicket ? 'Edit Ticket Type' : 'Add New Ticket Type'}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ticket Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Adult, Child, Senior" {...field} />
                        </FormControl>
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
                          <Textarea
                            placeholder="e.g. Ages 18-59"
                            className="resize-none"
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (LKR) *</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {editingTicket ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Ticket className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No ticket types yet</p>
            <p className="text-sm">Add ticket types so customers can book visits</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-card"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{ticket.name}</span>
                    <Badge variant={ticket.is_active ? 'default' : 'secondary'}>
                      {ticket.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {ticket.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {ticket.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-primary">
                    LKR {ticket.price.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleStatus(ticket)}
                      title={ticket.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {ticket.is_active ? (
                        <ToggleRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(ticket)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Ticket Type</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{ticket.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(ticket.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
