import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Minus, Plus, ShoppingCart, Loader2 } from 'lucide-react';
import { Product } from '@/hooks/useProducts';
import { useProductVariants, ProductVariant } from '@/hooks/useProductVariants';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { VariantSelector } from './VariantSelector';

interface ProductVariantSelectorProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductVariantSelector = ({ product, isOpen, onClose }: ProductVariantSelectorProps) => {
  const { variants, loading } = useProductVariants(product?.id);
  const { addToCart } = useCart();
  
  const [selectedSize, setSelectedSize] = useState<ProductVariant | null>(null);
  const [selectedColor, setSelectedColor] = useState<ProductVariant | null>(null);
  const [selectedWeight, setSelectedWeight] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen) {
      // Reset selections when opened
      setSelectedSize(null);
      setSelectedColor(null);
      setSelectedWeight(null);
      setQuantity(1);
    }
  }, [isOpen]);

  const getCurrentPrice = () => {
    if (selectedSize) return selectedSize.price;
    if (selectedWeight) return selectedWeight.price;
    return product?.price || 0;
  };

  const getCurrentStock = () => {
    if (selectedSize) return selectedSize.stock;
    if (selectedWeight) return selectedWeight.stock;
    return product?.stock || 0;
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    const price = getCurrentPrice();
    const stock = getCurrentStock();
    
    let finalVariantId: string | undefined = undefined;
    let finalVariantName: string | undefined = undefined;

    // Determine primary variant (Size or Weight)
    const primaryVariant = selectedSize || selectedWeight;

    if (primaryVariant) {
      finalVariantId = primaryVariant.id;
      finalVariantName = primaryVariant.name;
      if (selectedColor) {
        finalVariantName += ` - ${selectedColor.name}`;
      }
    } else if (selectedColor) {
      finalVariantName = selectedColor.name;
      finalVariantId = undefined; 
    }

    if (stock === 0 && !selectedColor) { 
       if (primaryVariant && primaryVariant.stock === 0) {
         toast({ title: 'Out of Stock', variant: 'destructive' });
         return;
       }
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: price,
      image_url: product.image_url || undefined,
      vendor_id: product.vendor_id,
      stock: stock,
      quantity: quantity,
      category: product.category,
      variant_id: finalVariantId,
      variant_name: finalVariantName,
    });

    toast({
      title: 'Added to Cart',
      description: `${product.name}${finalVariantName ? ` (${finalVariantName})` : ''} has been added to your cart.`,
    });
    
    onClose();
  };

  if (!product) return null;

  const currentPrice = getCurrentPrice();
  const currentStock = getCurrentStock();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Options</DialogTitle>
          <DialogDescription>
            Choose your preferred variant and quantity for {product.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-md border bg-muted">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground line-clamp-1">{product.name}</h4>
              <p className="text-xl font-bold text-primary">LKR {currentPrice.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {currentStock > 0 ? `${currentStock} in stock` : 'Out of stock'}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <VariantSelector
              variants={variants}
              selectedSize={selectedSize}
              selectedColor={selectedColor}
              selectedWeight={selectedWeight}
              onSelectSize={(v) => {
                setSelectedSize(v);
                setSelectedWeight(null);
                setQuantity(1);
              }}
              onSelectWeight={(v) => {
                setSelectedWeight(v);
                setSelectedSize(null);
                setQuantity(1);
              }}
              onSelectColor={(v) => setSelectedColor(v)}
            />
          )}

          <div className="space-y-3">
            <Label className="text-base">Quantity</Label>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10" 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center text-lg font-bold">{quantity}</span>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10" 
                onClick={() => setQuantity(Math.min(currentStock || 1, quantity + 1))}
                disabled={quantity >= (currentStock || 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            className="w-full h-12 text-lg font-bold gap-2" 
            onClick={handleAddToCart}
            disabled={currentStock === 0 && !selectedColor}
          >
            <ShoppingCart className="h-5 w-5" />
            Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
