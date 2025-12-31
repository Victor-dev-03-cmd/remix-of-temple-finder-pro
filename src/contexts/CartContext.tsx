import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface CartItem {
  id: string; // Product ID
  cartItemId: string; // Unique ID (ID + Variant)
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  vendor_id: string;
  stock: number;
  category?: string;
  variant_id?: string;
  variant_name?: string;
}

interface AddToCartParams extends Omit<CartItem, 'quantity' | 'cartItemId'> {
  quantity?: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: AddToCartParams) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = 'temple-connect-cart';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      // Migration check: ensure every item has the required cartItemId
      return Array.isArray(parsed) && parsed.every(item => 'cartItemId' in item) ? parsed : [];
    } catch (error) {
      console.error("Cart hydration failed:", error);
      return [];
    }
  });

  // Persist to local storage whenever items change
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (newItem: AddToCartParams) => {
    const quantityToAdd = newItem.quantity ?? 1;
    const cartItemId = newItem.variant_id ? `${newItem.id}-${newItem.variant_id}` : newItem.id;

    setItems((prev) => {
      const existingItem = prev.find((i) => i.cartItemId === cartItemId);

      if (existingItem) {
        const potentialQuantity = existingItem.quantity + quantityToAdd;
        
        if (potentialQuantity > newItem.stock) {
          toast({
            title: 'Stock limit reached',
            description: `Only ${newItem.stock} units available.`,
            variant: 'destructive',
          });
          return prev;
        }

        return prev.map((i) =>
          i.cartItemId === cartItemId ? { ...i, quantity: potentialQuantity } : i
        );
      }

      // Check stock for completely new item
      if (quantityToAdd > newItem.stock) {
        toast({
          title: 'Stock limit reached',
          description: `Only ${newItem.stock} units available.`,
          variant: 'destructive',
        });
        return prev;
      }

      toast({ 
        title: 'Added to cart', 
        description: `${newItem.name} has been added.` 
      });

      return [...prev, { ...newItem, quantity: quantityToAdd, cartItemId }];
    });

    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, newQuantity: number) => {
    setItems((prev) => {
      const item = prev.find((i) => i.cartItemId === cartItemId);
      if (!item) return prev;

      // Logic: Remove if quantity is set to 0
      if (newQuantity <= 0) return prev.filter((i) => i.cartItemId !== cartItemId);

      // Logic: Cap at maximum stock
      if (newQuantity > item.stock) {
        toast({
          title: 'Stock limit reached',
          description: `Maximum available stock is ${item.stock}.`,
          variant: 'destructive',
        });
        return prev.map((i) =>
          i.cartItemId === cartItemId ? { ...i, quantity: item.stock } : i
        );
      }

      return prev.map((i) =>
        i.cartItemId === cartItemId ? { ...i, quantity: newQuantity } : i
      );
    });
  };

  const clearCart = () => setItems([]);

  // Memoize calculations for performance
  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const totalPrice = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};