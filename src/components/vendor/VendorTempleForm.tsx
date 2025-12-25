import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

const templeFormSchema = z.object({
  name: z.string().min(2, 'Temple name must be at least 2 characters'),
  deity: z.string().min(2, 'Deity name is required'),
  province: z.string().min(1, 'Province is required'),
  district: z.string().min(1, 'District is required'),
  address: z.string().optional(),
  description: z.string().optional(),
  contact: z.string().optional(),
  opening_hours: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

type TempleFormValues = z.infer<typeof templeFormSchema>;

interface VendorTempleFormProps {
  onSuccess: () => void;
  businessName?: string;
}

const VendorTempleForm = ({ onSuccess, businessName }: VendorTempleFormProps) => {
  const { data: settings } = useSiteSettings();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const country = settings?.defaultCountry || 'LK';
  const locationData = locationsByCountry[country] || locationsByCountry['LK'];

  const form = useForm<TempleFormValues>({
    resolver: zodResolver(templeFormSchema),
    defaultValues: {
      name: '',
      deity: '',
      province: '',
      district: '',
      address: '',
      description: '',
      contact: '',
      opening_hours: '',
      latitude: 0,
      longitude: 0,
    },
  });

  const selectedProvince = form.watch('province');
  const districts = selectedProvince ? locationData.districts[selectedProvince] || [] : [];

  // Reset district when province changes
  useEffect(() => {
    form.setValue('district', '');
  }, [selectedProvince, form]);

  const onSubmit = async (values: TempleFormValues) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get province and district names
      const provinceData = locationData.provinces.find(p => p.id === values.province);
      const districtData = districts.find(d => d.id === values.district);

      const { error } = await supabase
        .from('temples')
        .insert({
          name: values.name,
          deity: values.deity,
          province: provinceData?.name || values.province,
          district: districtData?.name || values.district,
          address: values.address || null,
          description: values.description || null,
          contact: values.contact || null,
          opening_hours: values.opening_hours || null,
          latitude: values.latitude,
          longitude: values.longitude,
          owner_user_id: user.id,
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: 'Temple Created',
        description: 'Your temple has been successfully registered.',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error creating temple:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create temple',
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
            <CardTitle>Create Your Temple</CardTitle>
            <CardDescription>
              {businessName ? `Register the temple for ${businessName}` : 'Register your temple to start adding products'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="any"
                        placeholder="6.9271" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="any"
                        placeholder="79.8612" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Temple...
                </>
              ) : (
                'Create Temple'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default VendorTempleForm;
