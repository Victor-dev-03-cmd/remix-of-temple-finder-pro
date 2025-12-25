import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TempleTicket {
  id: string;
  temple_id: string;
  name: string;
  description: string | null;
  price: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTicketData {
  temple_id: string;
  name: string;
  description?: string;
  price: number;
  is_active?: boolean;
  display_order?: number;
}

export interface UpdateTicketData {
  name?: string;
  description?: string;
  price?: number;
  is_active?: boolean;
  display_order?: number;
}

export const useTempleTickets = (templeId: string | undefined) => {
  const [tickets, setTickets] = useState<TempleTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    if (!templeId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('temple_tickets')
        .select('*')
        .eq('temple_id', templeId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [templeId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const createTicket = async (data: CreateTicketData) => {
    try {
      const { error } = await supabase
        .from('temple_tickets')
        .insert(data);

      if (error) throw error;
      toast.success('Ticket type created');
      fetchTickets();
      return true;
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket type');
      return false;
    }
  };

  const updateTicket = async (ticketId: string, data: UpdateTicketData) => {
    try {
      const { error } = await supabase
        .from('temple_tickets')
        .update(data)
        .eq('id', ticketId);

      if (error) throw error;
      toast.success('Ticket type updated');
      fetchTickets();
      return true;
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error('Failed to update ticket type');
      return false;
    }
  };

  const deleteTicket = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from('temple_tickets')
        .delete()
        .eq('id', ticketId);

      if (error) throw error;
      toast.success('Ticket type deleted');
      fetchTickets();
      return true;
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast.error('Failed to delete ticket type');
      return false;
    }
  };

  const toggleTicketStatus = async (ticketId: string, isActive: boolean) => {
    return updateTicket(ticketId, { is_active: isActive });
  };

  return {
    tickets,
    loading,
    refetch: fetchTickets,
    createTicket,
    updateTicket,
    deleteTicket,
    toggleTicketStatus,
  };
};

// Hook for public ticket fetching (for booking form)
export const usePublicTempleTickets = (templeId: string | undefined) => {
  const [tickets, setTickets] = useState<TempleTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!templeId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('temple_tickets')
          .select('*')
          .eq('temple_id', templeId)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;
        setTickets(data || []);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [templeId]);

  return { tickets, loading };
};
