import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, X, GitCommitHorizontal, Palette, Ruler, Weight, ExternalLink, Sparkles, Settings2, Tag, ChevronDown, ChevronUp } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import ProductImageUpload from './ProductImageUpload';

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Variant name is required'),
  type: z.string().min(1, 'Type is required'),
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
    type: 'Size',
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

  const [variantTypes, setVariantTypes] = useState<string[]>(['Size', 'Color', 'Weight', 'Material']);
  const [primaryVariantType, setPrimaryVariantType] = useState<string>('Size');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

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
        type: v.type || 'Size',
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

  useEffect(() => {
    if (initialData && initialData.variants && initialData.variants.length > 0) {
      const pricedVariant = initialData.variants.find((v: any) => v.price > 0);
      if (pricedVariant && pricedVariant.type) {
        setPrimaryVariantType(pricedVariant.type);
      }
    }
  }, [initialData]);

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      if (!variantTypes.includes(newCategoryName.trim())) {
        setVariantTypes([...variantTypes, newCategoryName.trim()]);
        setPrimaryVariantType(newCategoryName.trim());
        toast({ title: "Category Added", description: `New variant category '${newCategoryName}' added.` });
      }
      setNewCategoryName('');
      setIsCategoryDialogOpen(false);
    }
  };

  const handleGenerateDescription = async () => {
    const productName = form.getValues('name');
    if (!productName) {
      toast({ title: 'Product Name is missing', description: 'Please enter a product name first.', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an expert e-commerce copywriter. Write a compelling, SEO-friendly product description based on the product name provided. The tone should be engaging and highlight potential benefits. Keep it under 80 words.' },
          { role: 'user', content: `Generate a product description for: "${productName}"` },
        ],
        model: 'llama-3.3-70b-versatile',
      });

      const description = chatCompletion.choices[0]?.message?.content || '';
      form.setValue('description', description.trim());
      toast({ title: 'Description Generated', description: 'The AI-generated description has been filled in.' });
    } catch (error) {
      console.error('Error generating description:', error);
      toast({ title: 'Generation Failed', description: 'Could not generate a description at this time.', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const fetchTemple = async () => {
      if (!user) return;
      const { data } = await supabase.from('temples').select('id, name').eq('owner_user_id', user.id).maybeSingle();
      if (data) {
        setVendorTemple(data);
        if (!initialData) form.setValue('temple_id', data.id);
      }
    };
    fetchTemple();
  }, [user, initialData, form]);

  useEffect(() => {
    const storedColors = sessionStorage.getItem('selectedProductColors');
    if (storedColors) {
      try {
        const colors: string[] = JSON.parse(storedColors);
        colors.forEach((colorName) => {
          append({ name: colorName, type: 'Color', price: 0, stock: 0, sku: '' });
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
      const primaryVariants = variants.filter(v => v.type === primaryVariantType);
      const basePrice = primaryVariants.length > 0 ? Math.min(...primaryVariants.map(v => v.price)) : 0;
      const totalStock = primaryVariants.length > 0 ? primaryVariants.reduce((acc, v) => acc + v.stock, 0) : 0;

      const baseProduct = {
        name: productData.name,
        description: productData.description,
        category: productData.category,
        image_url: productData.image_url,
        vendor_id: user.id,
        temple_id: vendorTemple.id,
        price: basePrice,
        stock: totalStock,
      };

      let productId = initialData?.id;

      if (productId) {
        const { error: productError } = await supabase.from('products').update(baseProduct).eq('id', productId);
        if (productError) throw productError;
      } else {
        const { data: newProduct, error: productError } = await supabase.from('products').insert({ ...baseProduct, status: 'approved' }).select().single();
        if (productError) throw productError;
        productId = newProduct.id;
      }

      const uniqueVariants = variants.filter((v, index, self) => index === self.findIndex((t) => (t.name === v.name && t.type === v.type)));
      const { data: currentVariants } = await supabase.from('product_variants').select('id, name').eq('product_id', productId);
      
      const variantsToUpsert = uniqueVariants.map(v => {
         const existing = currentVariants?.find(cv => cv.id === v.id || cv.name === v.name);
         return {
           id: existing?.id, 
           product_id: productId,
           name: v.name,
           type: v.type, // Assuming DB has type column now, or we ignore it if not
           sku: v.type === primaryVariantType ? v.sku : null,
           price: v.type === primaryVariantType ? v.price : 0,
           stock: v.type === primaryVariantType ? v.stock : 0
         };
      });
      
      const updates = variantsToUpsert.filter(r => r.id !== undefined);
      const inserts = variantsToUpsert.filter(r => r.id === undefined).map(({ id, ...rest }) => rest);
      
      if (updates.length > 0) await supabase.from('product_variants').upsert(updates as any);
      if (inserts.length > 0) await supabase.from('product_variants').insert(inserts as any);
      
      const updatedIds = updates.map(u => u.id);
      const variantsToDelete = currentVariants?.filter(cv => !updatedIds.includes(cv.id)).map(v => v.id) || [];
      if (variantsToDelete.length > 0) await supabase.from('product_variants').delete().in('id', variantsToDelete);

      toast({ title: productId === initialData?.id ? 'Product Updated' : 'Product Added', description: 'Your product has been saved.' });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({ title: 'Error', description: `Failed to save product: ${(error as Error).message}`, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
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
                  <Button type="button" variant="ghost" size="sm" onClick={handleGenerateDescription} disabled={isGenerating} className="gap-2 text-xs">
                    <Sparkles className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                    {isGenerating ? 'Generating...' : 'Generate with AI'}
                  </Button>
                </div>
                <FormControl><Textarea placeholder="Describe your product..." className="min-h-[100px]" {...field} value={field.value ?? ''} /></FormControl>
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
                  <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                  <SelectContent>{productCategories.map((cat) => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div ref={variantSectionRef} className="space-y-4 rounded-lg border p-4">
            <div className='flex flex-col gap-4'>
               <div className="flex items-center justify-between">
                 <h3 className="flex items-center font-medium"><GitCommitHorizontal className="mr-2 h-4 w-4" /> Product Variants</h3>
                 <Button type="button" size='sm' variant='outline' onClick={() => { append({ name: '', type: primaryVariantType, price: 0, stock: 0, sku: '' }); scrollToVariants(); }}>
                    <Plus className='mr-2 h-3 w-3' /> Add Variant
                 </Button>
               </div>

               <div className="bg-muted/30 p-4 rounded-lg border border-dashed space-y-3">
                 <div className="flex items-center justify-between">
                   <div className="space-y-1">
                     <h4 className="text-sm font-semibold flex items-center gap-2"><Settings2 className="h-4 w-4 text-primary" /> Pricing & Stock Strategy</h4>
                     <p className="text-xs text-muted-foreground">Which variant type determines the price and stock?</p>
                   </div>
                   <div className="flex items-center gap-2">
                     <Select value={primaryVariantType} onValueChange={setPrimaryVariantType}>
                       <SelectTrigger className="w-[140px] h-8"><SelectValue /></SelectTrigger>
                       <SelectContent>{variantTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                     </Select>
                     <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                       <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Plus className="h-4 w-4" /></Button></DialogTrigger>
                       <DialogContent>
                         <DialogHeader><DialogTitle>Add New Variant Category</DialogTitle></DialogHeader>
                         <div className="py-4"><Input placeholder="e.g., Material, Style" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} /></div>
                         <DialogFooter><Button onClick={handleAddCategory}>Add Category</Button></DialogFooter>
                       </DialogContent>
                     </Dialog>
                   </div>
                 </div>
               </div>
            </div>

            <div className="space-y-3 rounded-md border border-dashed p-3 bg-muted/30">
              <p className="text-sm font-medium text-muted-foreground">Quick Add Variants:</p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => { append({ name: 'Small', type: 'Size', price: 0, stock: 0, sku: '' }); scrollToVariants(); }}>Small</Button>
                <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => { append({ name: 'Medium', type: 'Size', price: 0, stock: 0, sku: '' }); scrollToVariants(); }}>Medium</Button>
                <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => { append({ name: 'Large', type: 'Size', price: 0, stock: 0, sku: '' }); scrollToVariants(); }}>Large</Button>
                <div className="w-px h-6 bg-border mx-2"></div>
                <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => { append({ name: '100g', type: 'Weight', price: 0, stock: 0, sku: '' }); scrollToVariants(); }}>100g</Button>
                <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => { append({ name: '500g', type: 'Weight', price: 0, stock: 0, sku: '' }); scrollToVariants(); }}>500g</Button>
                <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => { append({ name: '1kg', type: 'Weight', price: 0, stock: 0, sku: '' }); scrollToVariants(); }}>1kg</Button>
                <div className="w-px h-6 bg-border mx-2"></div>
                <Button type="button" variant="outline" className="h-7 text-xs gap-2" onClick={() => { const currentUrl = window.location.pathname + window.location.search; navigate(`/vendor/products/colors?returnUrl=${encodeURIComponent(currentUrl)}`); }}>
                  <Palette className="h-3 w-3" /> Colors
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {fields.map((field, index) => {
                const currentType = form.watch(`variants.${index}.type`);
                const isPrimary = currentType === primaryVariantType;
                
                return (
                  <motion.div 
                    key={field.id} 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-md border relative transition-all ${isPrimary ? 'p-4 bg-card border-primary/20' : 'p-2 bg-muted/20 border-border flex items-center gap-4'}`}
                  >
                     {fields.length > 1 && (
                       <Button
                         type="button"
                         variant="ghost"
                         size="icon"
                         className={`absolute text-destructive hover:text-destructive hover:bg-destructive/10 ${isPrimary ? 'top-2 right-2 h-8 w-8' : 'right-2 h-8 w-8'}`}
                         onClick={() => remove(index)}
                       >
                         <X className="h-4 w-4" />
                       </Button>
                     )}
                     
                     {isPrimary ? (
                       // Primary Variant Layout (Full Details)
                       <div className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                           <FormField
                             control={form.control}
                             name={`variants.${index}.name`}
                             render={({ field }) => (
                               <FormItem className="space-y-1">
                                 <FormLabel className="text-xs">Variant Name</FormLabel>
                                 <FormControl><Input placeholder="e.g., Small" className="h-8" {...field} /></FormControl>
                                 <FormMessage />
                               </FormItem>
                             )}
                           />
                           <FormField
                             control={form.control}
                             name={`variants.${index}.type`}
                             render={({ field }) => (
                               <FormItem className="space-y-1">
                                 <FormLabel className="text-xs">Type</FormLabel>
                                 <Select onValueChange={field.onChange} value={field.value}>
                                   <FormControl><SelectTrigger className="h-8"><SelectValue /></SelectTrigger></FormControl>
                                   <SelectContent>{variantTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                 </Select>
                                 <FormMessage />
                               </FormItem>
                             )}
                           />
                         </div>
                         <div className="grid grid-cols-3 gap-4">
                           <FormField
                             control={form.control}
                             name={`variants.${index}.sku`}
                             render={({ field }) => (
                               <FormItem className="space-y-1">
                                 <FormLabel className="text-xs">SKU</FormLabel>
                                 <FormControl><Input placeholder="SKU-001" className="h-8" {...field} value={field.value ?? ''} /></FormControl>
                                 <FormMessage />
                               </FormItem>
                             )}
                           />
                           <FormField
                             control={form.control}
                             name={`variants.${index}.price`}
                             render={({ field }) => (
                               <FormItem className="space-y-1">
                                 <FormLabel className="text-xs">Price (LKR)</FormLabel>
                                 <FormControl><Input type="number" min="0" className="h-8" {...field} /></FormControl>
                                 <FormMessage />
                               </FormItem>
                             )}
                           />
                           <FormField
                             control={form.control}
                             name={`variants.${index}.stock`}
                             render={({ field }) => (
                               <FormItem className="space-y-1">
                                 <FormLabel className="text-xs">Stock</FormLabel>
                                 <FormControl><Input type="number" min="0" className="h-8" {...field} /></FormControl>
                                 <FormMessage />
                               </FormItem>
                             )}
                           />
                         </div>
                       </div>
                     ) : (
                       // Secondary Variant Layout (Compact)
                       <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                         <FormField
                           control={form.control}
                           name={`variants.${index}.name`}
                           render={({ field }) => (
                             <FormItem className="space-y-0 mb-0">
                               <FormControl><Input placeholder="Variant Name" className="h-8 bg-transparent border-none shadow-none focus-visible:ring-0 px-0 font-medium" {...field} /></FormControl>
                             </FormItem>
                           )}
                         />
                         <FormField
                           control={form.control}
                           name={`variants.${index}.type`}
                           render={({ field }) => (
                             <FormItem className="space-y-0 mb-0">
                               <Select onValueChange={field.onChange} value={field.value}>
                                 <FormControl><SelectTrigger className="h-8 border-none shadow-none bg-transparent focus:ring-0"><SelectValue /></SelectTrigger></FormControl>
                                 <SelectContent>{variantTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                               </Select>
                             </FormItem>
                           )}
                         />
                         {/* Hidden fields for secondary variants */}
                         <input type="hidden" {...form.register(`variants.${index}.price`)} value="0" />
                         <input type="hidden" {...form.register(`variants.${index}.stock`)} value="0" />
                       </div>
                     )}
                  </motion.div>
                );
              })}
            </div>
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
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : initialData ? 'Update Product' : 'Add Product'}</Button>
        </div>
      </form>
    </Form>
  );
};

export default ProductForm;