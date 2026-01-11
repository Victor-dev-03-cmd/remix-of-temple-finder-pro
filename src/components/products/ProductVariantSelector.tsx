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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Minus, Plus, ShoppingCart, Loader2 } from 'lucide-react';
import { Product } from '@/hooks/useProducts';
import { useProductVariants, ProductVariant } from '@/hooks/useProductVariants';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';

interface ProductVariantSelectorProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductVariantSelector = ({ product, isOpen, onClose }: ProductVariantSelectorProps) => {
  const { variants, loading } = useProductVariants(product?.id);
  const { addToCart } = useCart();
  
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (variants.length > 0 && !selectedVariant) {
      setSelectedVariant(variants[0]);
    }
  }, [variants, selectedVariant]);

  const handleAddToCart = () => {
    if (!product) return;
    
    const price = selectedVariant ? selectedVariant.price : product.price;
    const stock = selectedVariant ? selectedVariant.stock : product.stock;
    const variantId = selectedVariant?.id;
    const variantName = selectedVariant?.name;

    if (stock === 0) {
      toast({ title: 'Out of Stock', variant: 'destructive' });
      return;
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
      variant_id: variantId,
      variant_name: variantName,
    });

    toast({
      title: 'Added to Cart',
      description: `${product.name}${variantName ? ` (${variantName})` : ''} has been added to your cart.`,
    });
    
    onClose();
  };

  if (!product) return null;

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;

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
          ) : variants.length > 0 ? (
            <div className="space-y-3">
              <Label className="text-base">Variants</Label>
              <RadioGroup 
                value={selectedVariant?.id} 
                onValueChange={(id) => setSelectedVariant(variants.find(v => v.id === id) || null)}
                className="grid grid-cols-3 gap-2"
              >
                {variants.map((variant) => (
                  <div key={variant.id} className="relative">
                    <RadioGroupItem
                      value={variant.id}
                      id={variant.id}
                      className="peer sr-only"
                      disabled={variant.stock === 0}
                    />
                    <Label
                      htmlFor={variant.id}
                      className={`flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary transition-all cursor-pointer h-full text-center ${variant.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className="font-bold text-xs line-clamp-1">{variant.name}</span>
                      <span className="font-black text-[10px] text-primary mt-1">LKR {variant.price.toLocaleString()}</span>
                      {variant.stock <= 3 && variant.stock > 0 && (
                        <span className="text-[8px] text-orange-600 font-bold mt-0.5">{variant.stock} left</span>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ) : null}

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
            disabled={currentStock === 0}
          >
            <ShoppingCart className="h-5 w-5" />
            Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
