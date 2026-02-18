import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingCart, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { ProductVariantSelector } from './ProductVariantSelector';
import { toast } from '@/hooks/use-toast';
import { Product } from '@/hooks/useProducts';
import { getCategoryLabel } from '@/lib/categories';

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isVariantSelectorOpen, setIsVariantSelectorOpen] = useState(false);

  // Calculate display price: 
  // 1. If product price > 0, use it.
  // 2. If product price is 0, find the minimum price from variants (excluding 0).
  const displayPrice = useMemo(() => {
    if (product.price > 0) return product.price;
    
    if (product.variants && product.variants.length > 0) {
      const prices = product.variants
        .map(v => v.price)
        .filter(p => p > 0);
      
      if (prices.length > 0) {
        return Math.min(...prices);
      }
    }
    
    return 0;
  }, [product]);

  // Calculate display stock:
  // If product stock is 0, check if variants have stock.
  const displayStock = useMemo(() => {
    if (product.stock > 0) return product.stock;
    
    if (product.variants && product.variants.length > 0) {
       return product.variants.reduce((acc, v) => acc + v.stock, 0);
    }
    
    return 0;
  }, [product]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsVariantSelectorOpen(true);
  };

  return (
    <>
      <Link to={`/product/${product.id}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          whileHover={{ y: -3 }}
          className="group overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
        >
          {/* Image */}
          <div className="relative aspect-square overflow-hidden bg-muted">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            {displayStock <= 5 && displayStock > 0 && (
              <span className="absolute top-2 right-2 rounded-full bg-orange-500 px-2 py-0.5 text-xs font-medium text-white">
                Low Stock
              </span>
            )}
            {displayStock === 0 && (
              <span className="absolute top-2 right-2 rounded-full bg-destructive px-2 py-0.5 text-xs font-medium text-destructive-foreground">
                Out of Stock
              </span>
            )}
          </div>

          {/* Content */}
          <div className="p-3">
            <p className="mb-1 text-xs text-muted-foreground">{getCategoryLabel(product.category)}</p>
            <h4 className="mb-1 text-sm font-medium text-foreground line-clamp-1">
              {product.name}
            </h4>
            
            {/* Temple Badge */}
            {product.temple && (
              <div className="mb-2 flex items-center gap-1 text-xs text-primary">
                <Building className="h-3 w-3" />
                <span className="truncate">{product.temple.name}</span>
              </div>
            )}
            
            <p className="mb-3 text-lg font-semibold text-primary">
              {displayPrice > 0 ? `LKR ${displayPrice.toLocaleString()}` : 'Price on Request'}
            </p>
            <Button
              onClick={handleAddToCart}
              size="sm"
              className="w-full gap-2"
              disabled={displayStock === 0}
            >
              <ShoppingCart className="h-4 w-4" />
              {displayStock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
        </motion.div>
      </Link>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <ProductVariantSelector 
        product={product} 
        isOpen={isVariantSelectorOpen} 
        onClose={() => setIsVariantSelectorOpen(false)} 
      />
    </>
  );
};

export default ProductCard;
