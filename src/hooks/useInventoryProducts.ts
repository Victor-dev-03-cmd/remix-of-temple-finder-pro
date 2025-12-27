
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Product = Tables<'products'>;
export type NewProduct = TablesInsert<'products'>;
export type UpdatedProduct = TablesUpdate<'products'>;

// Fetch vendor products
const fetchVendorProducts = async (vendorId: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Add a new product
const addProduct = async (product: NewProduct) => {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Update an existing product
const updateProduct = async (product: UpdatedProduct) => {
  if (!product.id) throw new Error('Product ID is required for updates');
  const { data, error } = await supabase
    .from('products')
    .update(product)
    .eq('id', product.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete a product
const deleteProduct = async (productId: string) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) throw error;
  return productId;
};

export const useInventoryProducts = (vendorId: string) => {
  const queryClient = useQueryClient();
  const queryKey = ['inventory-products', vendorId];

  const { data: products = [], isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => fetchVendorProducts(vendorId),
    enabled: !!vendorId,
  });

  const addProductMutation = useMutation({
    mutationFn: addProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    products,
    isLoading,
    isError,
    error,
    addProduct: addProductMutation.mutateAsync,
    updateProduct: updateProductMutation.mutateAsync,
    deleteProduct: deleteProductMutation.mutateAsync,
  };
};
