import { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Loader2, GripVertical, Image, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface GalleryImage {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

interface SortableImageProps {
  image: GalleryImage;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, field: 'title' | 'description', value: string) => void;
}

const SortableImage = ({ image, onToggleActive, onDelete, onUpdate }: SortableImageProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg border border-border overflow-hidden bg-card ${
        !image.is_active ? 'opacity-50' : ''
      } ${isDragging ? 'shadow-xl ring-2 ring-primary' : ''}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 flex h-8 w-8 cursor-grab items-center justify-center rounded bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="aspect-video">
        <img
          src={image.image_url}
          alt={image.title || 'Gallery image'}
          className="h-full w-full object-cover pointer-events-none"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Actions */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8"
          onClick={() => onToggleActive(image.id, image.is_active)}
        >
          {image.is_active ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </Button>
        <Button
          size="icon"
          variant="destructive"
          className="h-8 w-8"
          onClick={() => onDelete(image.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Title & Description */}
      <div className="p-3 space-y-2 bg-card">
        <Input
          placeholder="Image title"
          value={image.title || ''}
          onChange={(e) => onUpdate(image.id, 'title', e.target.value)}
          className="h-8 text-sm"
        />
        <Input
          placeholder="Description (optional)"
          value={image.description || ''}
          onChange={(e) => onUpdate(image.id, 'description', e.target.value)}
          className="h-8 text-sm"
        />
      </div>
    </div>
  );
};

const HomeGallerySettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('home_gallery_images')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (err) {
      console.error('Error fetching gallery images:', err);
      toast({
        title: 'Error loading gallery',
        description: 'Could not load gallery images.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);

      const newImages = arrayMove(images, oldIndex, newIndex);
      setImages(newImages);

      // Update display_order in database
      try {
        const updates = newImages.map((img, index) => ({
          id: img.id,
          display_order: index,
        }));

        for (const update of updates) {
          await supabase
            .from('home_gallery_images')
            .update({ display_order: update.display_order })
            .eq('id', update.id);
        }

        toast({
          title: 'Order updated',
          description: 'Gallery order has been saved.',
        });
      } catch (err) {
        console.error('Error updating order:', err);
        toast({
          title: 'Error',
          description: 'Could not save the new order.',
          variant: 'destructive',
        });
        fetchImages(); // Revert to original order
      }
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: 'File too large',
            description: `${file.name} is larger than 5MB.`,
            variant: 'destructive',
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `gallery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `gallery/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('site-assets')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('site-assets')
          .getPublicUrl(filePath);

        const { error: insertError } = await supabase
          .from('home_gallery_images')
          .insert({
            image_url: publicUrl,
            display_order: images.length,
          });

        if (insertError) throw insertError;
      }

      toast({
        title: 'Images uploaded',
        description: 'Gallery images have been added successfully.',
      });
      fetchImages();
    } catch (err) {
      console.error('Error uploading images:', err);
      toast({
        title: 'Upload failed',
        description: 'Could not upload images. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('home_gallery_images')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;

      setImages(images.map(img =>
        img.id === id ? { ...img, is_active: !isActive } : img
      ));
    } catch (err) {
      console.error('Error toggling image:', err);
      toast({
        title: 'Error',
        description: 'Could not update image status.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateImage = async (id: string, field: 'title' | 'description', value: string) => {
    try {
      const { error } = await supabase
        .from('home_gallery_images')
        .update({ [field]: value || null })
        .eq('id', id);

      if (error) throw error;

      setImages(images.map(img =>
        img.id === id ? { ...img, [field]: value || null } : img
      ));
    } catch (err) {
      console.error('Error updating image:', err);
    }
  };

  const handleDeleteImage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('home_gallery_images')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setImages(images.filter(img => img.id !== id));
      toast({
        title: 'Image deleted',
        description: 'Gallery image has been removed.',
      });
    } catch (err) {
      console.error('Error deleting image:', err);
      toast({
        title: 'Error',
        description: 'Could not delete image.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-video rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Home Page Gallery
        </CardTitle>
        <CardDescription>
          Manage the bento-grid gallery images displayed on the home page. Drag images to reorder.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Section */}
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
            id="gallery-upload"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {uploading ? 'Uploading...' : 'Upload Images'}
          </Button>
          <p className="text-sm text-muted-foreground">
            Max 5MB per image. Supports JPG, PNG, WebP.
          </p>
        </div>

        {/* Images Grid */}
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
            <Image className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No gallery images yet</p>
            <p className="text-sm text-muted-foreground">Upload images to create your bento gallery</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={images.map(img => img.id)} strategy={rectSortingStrategy}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {images.map((image) => (
                  <SortableImage
                    key={image.id}
                    image={image}
                    onToggleActive={handleToggleActive}
                    onDelete={handleDeleteImage}
                    onUpdate={handleUpdateImage}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
};

export default HomeGallerySettings;