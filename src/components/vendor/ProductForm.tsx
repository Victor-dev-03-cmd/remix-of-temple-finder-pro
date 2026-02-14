import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, X, GitCommitHorizontal, Palette, Ruler, Weight, ExternalLink, Sparkles } from 'lucide-react';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Groq from 'groq-sdk';
import { supabase } from '@/integrations/supabase/client';
import { productCategories } from '@/lib/categories';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { toast } from '@/hooks/use-toast';
import ProductImageUpload from './ProductImageUpload';

// Predefined colors list to check against
const predefinedColors = [
  'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'Indigo', 'Teal', 'Cyan', 
  'Black', 'White', 'Gray', 'Gold', 'Silver', 'Bronze', 'Rose Gold', 'Navy', 'Maroon', 
  'Olive', 'Beige', 'Cream', 'Brown', 'Charcoal'
];

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Variant name is required'),
  sku: z.string().optional().nullable(),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
  stock: z.coerce.number().min(0, 'Stock must be non-negative'),
});

const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(1000).optional().nullable(),
  category: z.string().min(1, 'Please select a category'),
  image_url: z.string().optional().nullable(),
  temple_id: z.string().min(1, 'An associated temple is required'),
  variants: z.array(variantSchema).min(1, 'At least one product variant is required'),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const emptyFormValues: Omit<ProductFormValues, 'temple_id'> = {
  name: '',
  description: '',
  category: '',
  image_url: null,
  variants: [{
    name: 'Default',
    price: 0,
    stock: 0,
    sku: ''
  }],
};

const ProductForm = ({ initialData, onSuccess, onCancel }: ProductFormProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vendorTemple, setVendorTemple] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const variantSectionRef = useRef<HTMLDivElement>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      description: initialData.description,
      category: initialData.category,
      image_url: initialData.image_url,
      temple_id: initialData.temple_id || '',
      variants: initialData.variants.length > 0 ? initialData.variants.map((v: any) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        price: v.price,
        stock: v.stock,
      })) : [emptyFormValues.variants[0]],
    } : emptyFormValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const groq = new Groq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const handleGenerateDescription = async () => {
    const productName = form.getValues('name');
    if (!productName) {
      toast({
        title: 'Product Name is missing',
        description: 'Please enter a product name first.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert e-commerce copywriter. Write a compelling, SEO-friendly product description based on the product name provided. The tone should be engaging and highlight potential benefits. Keep it under 80 words.',
          },
          {
            role: 'user',
            content: `Generate a product description for: "${productName}"`,
          },
        ],
        model: 'llama-3.3-70b-versatile',
      });

      const description = chatCompletion.choices[0]?.message?.content || '';
      form.setValue('description', description.trim());
      toast({
        title: 'Description Generated',
        description: 'The AI-generated description has been filled in.',
      });
    } catch (error) {
      console.error('Error generating description:', error);
      toast({
        title: 'Generation Failed',
        description: 'Could not generate a description at this time.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };


  useEffect(() => {
    const fetchTemple = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('temples')
        .select('id, name')
        .eq('owner_user_id', user.id)
        .maybeSingle();

      if (data) {
        setVendorTemple(data);
        if (!initialData) {
          form.setValue('temple_id', data.id);
        }
      }
    };
    fetchTemple();
  }, [user, initialData, form]);

  useEffect(() => {
    const storedColors = sessionStorage.getItem('selectedProductColors');
    if (storedColors) {
      try {
        const colors: string[] = JSON.parse(storedColors);
        // Instead of just appending, we can also combine with existing variants if needed.
        // For now, let's just append them as new variants.
        colors.forEach((colorName) => {
          append({ name: colorName, price: 0, stock: 0, sku: '' });
        });
        sessionStorage.removeItem('selectedProductColors');
        scrollToVariants();
        toast({ title: 'Colors Added', description: `${colors.length} color variant(s) added.` });
      } catch (e) {
        console.error('Failed to parse stored colors', e);
      }
    }
  }, [append]);

  const scrollToVariants = () => {
    setTimeout(() => {
      variantSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const onSubmit = async (values: ProductFormValues) => {
    if (!user || !vendorTemple) {
      toast({ title: 'Error', description: 'Cannot save product without an associated temple.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { variants, ...productData } = values;
      const baseProduct = {
        name: productData.name,
        description: productData.description,
        category: productData.category,
        image_url: productData.image_url,
        vendor_id: user.id,
        temple_id: vendorTemple.id,
        // Calculate min price excluding 0 price variants (like colors) unless all are 0
        price: variants.length > 0 
          ? (variants.some(v => v.price > 0) 
              ? Math.min(...variants.filter(v => v.price > 0).map(v => v.price)) 
              : 0)
          : 0,
        stock: variants.reduce((acc, v) => acc + v.stock, 0),
      };

      if (initialData?.id) {
        const { data: updatedProduct, error: productError } = await supabase
          .from('products')
          .update(baseProduct)
          .eq('id', initialData.id)
          .select()
          .single();
        
        if (productError) throw productError;

        await supabase.from('product_variants').delete().eq('product_id', initialData.id);
        
        const { error: variantError } = await supabase.from('product_variants').insert(
          variants.map(v => ({ 
            name: v.name,
            sku: v.sku,
            price: v.price,
            stock: v.stock,
            product_id: updatedProduct.id 
          }))
        );
        if (variantError) throw variantError;

        toast({ title: 'Product Updated', description: 'Your product has been updated.' });
      } else {
        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert({ ...baseProduct, status: 'approved' })
          .select()
          .single();

        if (productError) throw productError;

        const { error: variantError } = await supabase.from('product_variants').insert(
          variants.map(v => ({ 
            name: v.name,
            sku: v.sku,
            price: v.price,
            stock: v.stock,
            product_id: newProduct.id 
          }))
        );
        if (variantError) throw variantError;

        toast({ title: 'Product Added', description: 'Your product has been added.' });
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({ title: 'Error', description: `Failed to save product: ${(error as Error).message}`, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Helper to check if a variant name is a color
  const isColorVariant = (name: string) => {
    return predefinedColors.some(color => color.toLowerCase() === name.toLowerCase());
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-2">
        <div className="md:col-span-2 space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl><Input placeholder="e.g., Brass Temple Bell" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Description</FormLabel>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateDescription}
                    disabled={isGenerating}
                    className="gap-2 text-xs"
                  >
                    <Sparkles className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                    {isGenerating ? 'Generating...' : 'Generate with AI'}
                  </Button>
                </div>
                <FormControl>
                  <Textarea placeholder="Describe your product..." className="min-h-[100px]" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {productCategories.map((cat) => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div ref={variantSectionRef} className="space-y-4 rounded-lg border p-4">
            <div className='flex items-center justify-between'>
               <h3 className="flex items-center font-medium">
                 <GitCommitHorizontal className="mr-2 h-4 w-4" /> Product Variants
               </h3>
               <Button 
                 type="button" 
                 size='sm' 
                 variant='outline' 
                 onClick={() => {
                   append({ name: '', price: 0, stock: 0, sku: '' });
                   scrollToVariants();
                 }}
               >
                  <Plus className='mr-2 h-3 w-3' /> Add Variant
               </Button>
            </div>

            <div className="space-y-3 rounded-md border border-dashed p-3 bg-muted/30">
              <p className="text-sm font-medium text-muted-foreground">Quick Add Variants:</p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Ruler className="h-4 w-4 text-primary" />
                  <span className="font-medium">Sizes:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Small', 'Medium', 'Large', 'XL', 'XXL'].map((size) => (
                    <Button
                      key={size}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        const currentVariants = form.getValues('variants');
                        const lastVariant = currentVariants[currentVariants.length - 1];
                        
                        if (currentVariants.length === 1 && (lastVariant.name === 'Default' || lastVariant.name === '')) {
                           form.setValue(`variants.${currentVariants.length - 1}.name`, size);
                        } else {
                           append({ name: size, price: 0, stock: 0, sku: '' });
                        }
                        scrollToVariants();
                      }}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-muted-foreground">With unit:</span>
                  {['cm', 'mm', 'inch'].map((unit) => (
                    <div key={unit} className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs px-2"
                        onClick={() => {
                          ['Small', 'Medium', 'Large', 'XL'].forEach((size) => {
                            append({ name: `${size} (${unit})`, price: 0, stock: 0, sku: '' });
                          });
                          scrollToVariants();
                        }}
                      >
                        Add all in {unit}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Weight className="h-4 w-4 text-primary" />
                  <span className="font-medium">Weights:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['50g', '100g', '250g', '500g', '1kg', '2kg', '5kg'].map((weight) => (
                    <Button
                      key={weight}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        append({ name: weight, price: 0, stock: 0, sku: '' });
                        scrollToVariants();
                      }}
                    >
                      {weight}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-muted-foreground">Add preset:</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs px-2"
                    onClick={() => {
                      ['100g', '250g', '500g', '1kg'].forEach((weight) => {
                        append({ name: weight, price: 0, stock: 0, sku: '' });
                      });
                      scrollToVariants();
                    }}
                  >
                    Add grams set
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs px-2"
                    onClick={() => {
                      ['1kg', '2kg', '5kg', '10kg'].forEach((weight) => {
                        append({ name: weight, price: 0, stock: 0, sku: '' });
                      });
                      scrollToVariants();
                    }}
                  >
                    Add kg set
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Palette className="h-4 w-4 text-primary" />
                  <span className="font-medium">Colors:</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    const currentUrl = window.location.pathname + window.location.search;
                    navigate(`/vendor/products/colors?returnUrl=${encodeURIComponent(currentUrl)}`);
                  }}
                >
                  <Palette className="h-4 w-4" />
                  Open Color Picker
                  <ExternalLink className="h-3 w-3" />
                </Button>
                <p className="text-xs text-muted-foreground">
                  Select multiple colors from our comprehensive color palette
                </p>
                
                {/* New Feature: Combine Variants */}
                <div className="pt-2">
                   <Button
                     type="button"
                     variant="secondary"
                     size="sm"
                     className="w-full"
                     onClick={() => {
                       toast({ title: "Tip", description: "You can edit variant names to include both size and color (e.g., 'Small - Red')." });
                     }}
                   >
                     <Sparkles className="mr-2 h-3 w-3" />
                     Tip: Combine Size & Color in Name
                   </Button>
                </div>
              </div>
            </div>

            {fields.map((field, index) => {
              const isColor = isColorVariant(form.watch(`variants.${index}.name`));
              
              return (
                <motion.div 
                  key={field.id} 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 rounded-md border p-3 relative"
                >
                   {fields.length > 1 && (
                     <Button
                       type="button"
                       variant="ghost"
                       size="icon"
                       className="absolute top-2 right-2 h-6 w-6"
                       onClick={() => remove(index)}
                     >
                       <X className="h-4 w-4 text-destructive" />
                     </Button>
                   )}
                   <FormField
                     control={form.control}
                     name={`variants.${index}.name`}
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Variant Name</FormLabel>
                         <FormControl><Input placeholder="e.g., Small, Blue, 500g" {...field} /></FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                   
                   {/* Conditionally render Price and Stock based on whether it's a color variant */}
                   {!isColor ? (
                     <div className="grid grid-cols-3 gap-4">
                       <FormField
                         control={form.control}
                         name={`variants.${index}.sku`}
                         render={({ field }) => (
                           <FormItem>
                             <FormLabel>SKU</FormLabel>
                             <FormControl><Input placeholder="SKU-001" {...field} value={field.value ?? ''} /></FormControl>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                       <FormField
                         control={form.control}
                         name={`variants.${index}.price`}
                         render={({ field }) => (
                           <FormItem>
                             <FormLabel>Price (LKR)</FormLabel>
                             <FormControl><Input type="number" min="0" placeholder="0" {...field} /></FormControl>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                       <FormField
                         control={form.control}
                         name={`variants.${index}.stock`}
                         render={({ field }) => (
                           <FormItem>
                             <FormLabel>Stock</FormLabel>
                             <FormControl><Input type="number" min="0" placeholder="0" {...field} /></FormControl>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                     </div>
                   ) : (
                     <div className="flex items-center gap-2 p-2 bg-muted/30 rounded text-sm text-muted-foreground">
                       <Palette className="h-4 w-4" />
                       <span>This is a color variant. Price and stock are managed by the main product or size variants.</span>
                       {/* Hidden fields to maintain form structure/values if needed, or just let them be 0 */}
                       <input type="hidden" {...form.register(`variants.${index}.price`)} value="0" />
                       <input type="hidden" {...form.register(`variants.${index}.stock`)} value="0" />
                     </div>
                   )}
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <ProductImageUpload
            currentImageUrl={form.watch('image_url')}
            onImageUploaded={(url) => form.setValue('image_url', url)}
            onImageRemoved={() => form.setValue('image_url', null)}
          />
        </div>

        <div className="md:col-span-3 flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : initialData ? 'Update Product' : 'Add Product'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProductForm;