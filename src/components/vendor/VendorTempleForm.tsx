import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building, Loader2, Upload, X, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { locationsByCountry } from '@/lib/locations';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTempleImageUpload } from '@/hooks/useTempleImageUpload';

const templeFormSchema = z.object({
  name: z.string().min(2, 'Temple name must be at least 2 characters'),
  deity: z.string().min(2, 'Deity name is required'),
  province: z.string().min(1, 'Province is required'),
  district: z.string().min(1, 'District is required'),
  address: z.string().optional(),
  description: z.string().optional(),
  contact: z.string().optional(),
  opening_hours: z.string().optional(),
});

type TempleFormValues = z.infer<typeof templeFormSchema>;

interface Temple {
  id: string;
  name: string;
  deity: string;
  province: string;
  district: string;
  address: string | null;
  description: string | null;
  contact: string | null;
  opening_hours: string | null;
  image_url: string | null;
}

interface VendorTempleFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
  businessName?: string;
  temple?: Temple | null;
  isEditing?: boolean;
}

const VendorTempleForm = ({ onSuccess, onCancel, businessName, temple, isEditing = false }: VendorTempleFormProps) => {
  const { data: settings } = useSiteSettings();
  const { toast } = useToast();
  const { uploadImage, deleteImage, isUploading, uploadProgress } = useTempleImageUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(temple?.image_url || null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const country = settings?.defaultCountry || 'LK';
  const locationData = locationsByCountry[country] || locationsByCountry['LK'];

  // Find province id from name for edit mode
  const findProvinceId = (provinceName: string) => {
    const province = locationData.provinces.find(p => p.name === provinceName);
    return province?.id || '';
  };

  // Find district id from name for edit mode
  const findDistrictId = (districtName: string, provinceId: string) => {
    const districts = locationData.districts[provinceId] || [];
    const district = districts.find(d => d.name === districtName);
    return district?.id || '';
  };

  const initialProvinceId = temple ? findProvinceId(temple.province) : '';

  const form = useForm<TempleFormValues>({
    resolver: zodResolver(templeFormSchema),
    defaultValues: {
      name: temple?.name || '',
      deity: temple?.deity || '',
      province: initialProvinceId,
      district: temple ? findDistrictId(temple.district, initialProvinceId) : '',
      address: temple?.address || '',
      description: temple?.description || '',
      contact: temple?.contact || '',
      opening_hours: temple?.opening_hours || '',
    },
  });

  const selectedProvince = form.watch('province');
  const districts = selectedProvince ? locationData.districts[selectedProvince] || [] : [];

  // Reset district when province changes (only if not initial load)
  useEffect(() => {
    if (!isEditing || (isEditing && selectedProvince !== initialProvinceId)) {
      form.setValue('district', '');
    }
  }, [selectedProvince, isEditing, initialProvinceId, form]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image
    const url = await uploadImage(file, temple?.id);
    if (url) {
      setImageUrl(url);
      setImagePreview(null);
    }
  };

  const handleRemoveImage = async () => {
    if (imageUrl) {
      await deleteImage(imageUrl);
      setImageUrl(null);
    }
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (values: TempleFormValues) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get province and district names
      const provinceData = locationData.provinces.find(p => p.id === values.province);
      const districtData = districts.find(d => d.id === values.district);

      const templeData = {
        name: values.name,
        deity: values.deity,
        province: provinceData?.name || values.province,
        district: districtData?.name || values.district,
        address: values.address || null,
        description: values.description || null,
        contact: values.contact || null,
        opening_hours: values.opening_hours || null,
        image_url: imageUrl,
        latitude: 0,
        longitude: 0,
      };

      if (isEditing && temple) {
        const { error } = await supabase
          .from('temples')
          .update(templeData)
          .eq('id', temple.id);

        if (error) throw error;

        toast({
          title: 'Temple Updated',
          description: 'Your temple information has been updated.',
        });
      } else {
        const { error } = await supabase
          .from('temples')
          .insert({
            ...templeData,
            owner_user_id: user.id,
            is_active: true,
          });

        if (error) throw error;

        toast({
          title: 'Temple Created',
          description: 'Your temple has been successfully registered.',
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving temple:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save temple',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Building className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>{isEditing ? 'Edit Temple' : 'Create Your Temple'}</CardTitle>
            <CardDescription>
              {isEditing 
                ? 'Update your temple information' 
                : businessName 
                  ? `Register the temple for ${businessName}` 
                  : 'Register your temple to start adding products'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <FormLabel>Temple Image</FormLabel>
              <div className="flex items-start gap-4">
                <div className="relative h-32 w-48 rounded-lg border-2 border-dashed border-border bg-muted/50 overflow-hidden">
                  {(imageUrl || imagePreview) ? (
                    <>
                      <img 
                        src={imagePreview || imageUrl || ''} 
                        alt="Temple preview" 
                        className="h-full w-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={handleRemoveImage}
                        disabled={isUploading}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-8 w-8 mb-1" />
                      <span className="text-xs">No image</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Image
                      </>
                    )}
                  </Button>
                  {isUploading && (
                    <Progress value={uploadProgress} className="h-2 w-32" />
                  )}
                  <p className="text-xs text-muted-foreground">
                    Max 5MB, JPG/PNG
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temple Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Sri Murugan Temple" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Main Deity *</FormLabel>
                    <FormControl>
                      <Input placeholder="Lord Murugan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="province"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Province *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select province" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locationData.provinces.map((province) => (
                          <SelectItem key={province.id} value={province.id}>
                            {province.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>District *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!selectedProvince}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select district" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {districts.map((district) => (
                          <SelectItem key={district.id} value={district.id}>
                            {district.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Address</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter the full temple address" 
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the temple's history, significance, and features" 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+94 XX XXX XXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="opening_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opening Hours</FormLabel>
                    <FormControl>
                      <Input placeholder="6:00 AM - 8:00 PM" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-3">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                  Cancel
                </Button>
              )}
              <Button type="submit" className={onCancel ? 'flex-1' : 'w-full'} disabled={isSubmitting || isUploading}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  isEditing ? 'Update Temple' : 'Create Temple'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default VendorTempleForm;
