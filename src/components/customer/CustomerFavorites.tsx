import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Trash2, ShoppingCart, RefreshCw, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface Favorite {
  id: string;
  product_id: string;
  created_at: string;
  product: {
    id: string;
    name: string;
    price: number;
    category: string;
    status: string;
    vendor_id: string;
  } | null;
}

const CustomerFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id, product_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch product details for each favorite
      const favoritesWithProducts = await Promise.all(
        (data || []).map(async (fav) => {
          const { data: product } = await supabase
            .from('products')
            .select('id, name, price, category, status, vendor_id')
            .eq('id', fav.product_id)
            .maybeSingle();
          return { ...fav, product };
        })
      );

      setFavorites(favoritesWithProducts);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  const handleRemove = async (favoriteId: string) => {
    try {
      const { error } = await supabase.from('favorites').delete().eq('id', favoriteId);
      if (error) throw error;
      setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
      toast({ title: 'Removed', description: 'Item removed from favorites.' });
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove item.',
        variant: 'destructive',
      });
    }
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      lamps: 'Lamps & Diyas',
      incense: 'Incense',
      pooja: 'Pooja Items',
      idols: 'Idols',
      jewelry: 'Jewelry',
      flowers: 'Flowers',
      prasad: 'Prasad',
      other: 'Other',
    };
    return categories[category] || category;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border bg-card"
    >
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <Heart className="h-5 w-5" />
            My Favorites
          </h2>
          <p className="text-sm text-muted-foreground">Products you've saved for later</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchFavorites} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="divide-y divide-border">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Heart className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>No favorites yet. Browse products and save your favorites!</p>
          </div>
        ) : (
          favorites.map((favorite) => (
            <div
              key={favorite.id}
              className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {favorite.product?.name || 'Unknown Product'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {favorite.product
                      ? `LKR ${Number(favorite.product.price).toLocaleString()} • ${getCategoryLabel(
                          favorite.product.category
                        )}`
                      : 'Product unavailable'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {favorite.product && favorite.product.status === 'approved' && (
                  <Button variant="outline" size="sm" className="gap-1">
                    <ShoppingCart className="h-4 w-4" />
                    Add to Cart
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => handleRemove(favorite.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default CustomerFavorites;
