import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { TempleImageUpload } from '@/components/temples/TempleImageUpload';
import { Plus, Pencil, Trash2, MapPin, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface Temple {
  id: string;
  name: string;
  description: string | null;
  deity: string;
  province: string;
  district: string;
  address: string | null;
  image_url: string | null;
  latitude: number;
  longitude: number;
  rating: number | null;
  review_count: number | null;
  services: string[] | null;
  opening_hours: string | null;
  contact: string | null;
  is_active: boolean | null;
}

interface TempleFormData {
  name: string;
  description: string;
  deity: string;
  province: string;
  district: string;
  address: string;
  image_url: string;
  latitude: string;
  longitude: string;
  services: string;
  opening_hours: string;
  contact: string;
  is_active: boolean;
}

const initialFormData: TempleFormData = {
  name: '',
  description: '',
  deity: '',
  province: '',
  district: '',
  address: '',
  image_url: '',
  latitude: '',
  longitude: '',
  services: '',
  opening_hours: '',
  contact: '',
  is_active: true,
};

export const TempleManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemple, setEditingTemple] = useState<Temple | null>(null);
  const [formData, setFormData] = useState<TempleFormData>(initialFormData);
  const queryClient = useQueryClient();

  const { data: temples, isLoading } = useQuery({
    queryKey: ['admin-temples'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('temples')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Temple[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TempleFormData) => {
      const { error } = await supabase.from('temples').insert({
        name: data.name,
        description: data.description || null,
        deity: data.deity,
        province: data.province,
        district: data.district,
        address: data.address || null,
        image_url: data.image_url || null,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        services: data.services ? data.services.split(',').map(s => s.trim()) : [],
        opening_hours: data.opening_hours || null,
        contact: data.contact || null,
        is_active: data.is_active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-temples'] });
      queryClient.invalidateQueries({ queryKey: ['temples'] });
      toast.success('Temple created successfully');
      handleCloseDialog();
    },
    onError: (error) => {
      console.error('Create error:', error);
      toast.error('Failed to create temple');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TempleFormData }) => {
      const { error } = await supabase
        .from('temples')
        .update({
          name: data.name,
          description: data.description || null,
          deity: data.deity,
          province: data.province,
          district: data.district,
          address: data.address || null,
          image_url: data.image_url || null,
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
          services: data.services ? data.services.split(',').map(s => s.trim()) : [],
          opening_hours: data.opening_hours || null,
          contact: data.contact || null,
          is_active: data.is_active,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-temples'] });
      queryClient.invalidateQueries({ queryKey: ['temples'] });
      toast.success('Temple updated successfully');
      handleCloseDialog();
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error('Failed to update temple');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('temples').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-temples'] });
      queryClient.invalidateQueries({ queryKey: ['temples'] });
      toast.success('Temple deleted successfully');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete temple');
    },
  });

  const handleOpenCreate = () => {
    setEditingTemple(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (temple: Temple) => {
    setEditingTemple(temple);
    setFormData({
      name: temple.name,
      description: temple.description || '',
      deity: temple.deity,
      province: temple.province,
      district: temple.district,
      address: temple.address || '',
      image_url: temple.image_url || '',
      latitude: temple.latitude.toString(),
      longitude: temple.longitude.toString(),
      services: temple.services?.join(', ') || '',
      opening_hours: temple.opening_hours || '',
      contact: temple.contact || '',
      is_active: temple.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTemple(null);
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.deity || !formData.province || !formData.district) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      toast.error('Please provide valid coordinates');
      return;
    }

    if (editingTemple) {
      updateMutation.mutate({ id: editingTemple.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (temple: Temple) => {
    if (confirm(`Are you sure you want to delete "${temple.name}"?`)) {
      deleteMutation.mutate(temple.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold">Temple Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Temple
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemple ? 'Edit Temple' : 'Add New Temple'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <TempleImageUpload
                currentImageUrl={formData.image_url}
                onImageUploaded={(url) => setFormData({ ...formData, image_url: url })}
                onImageRemoved={() => setFormData({ ...formData, image_url: '' })}
                templeId={editingTemple?.id}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deity">Deity *</Label>
                  <Input
                    id="deity"
                    value={formData.deity}
                    onChange={(e) => setFormData({ ...formData, deity: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="province">Province *</Label>
                  <Input
                    id="province"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">District *</Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude *</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude *</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="services">Services (comma-separated)</Label>
                <Input
                  id="services"
                  value={formData.services}
                  onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                  placeholder="Puja, Weddings, Festivals"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="opening_hours">Opening Hours</Label>
                  <Input
                    id="opening_hours"
                    value={formData.opening_hours}
                    onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
                    placeholder="6:00 AM - 8:00 PM"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact</Label>
                  <Input
                    id="contact"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="+94 11 234 5678"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active (visible to public)</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingTemple ? 'Update Temple' : 'Create Temple'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {temples?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No temples yet. Add your first temple!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {temples?.map((temple) => (
            <Card key={temple.id} className={!temple.is_active ? 'opacity-60' : ''}>
              <div className="aspect-video relative overflow-hidden rounded-t-lg">
                <img
                  src={temple.image_url || '/placeholder.svg'}
                  alt={temple.name}
                  className="w-full h-full object-cover"
                />
                {!temple.is_active && (
                  <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded">
                    Inactive
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg line-clamp-1">{temple.name}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {temple.district}, {temple.province}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-1 text-sm mb-3">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span>{temple.rating?.toFixed(1) || '0.0'}</span>
                  <span className="text-muted-foreground">
                    ({temple.review_count || 0} reviews)
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenEdit(temple)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(temple)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
