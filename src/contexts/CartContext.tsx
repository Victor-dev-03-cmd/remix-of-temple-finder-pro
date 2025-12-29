import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface CartItem {
  id: string;
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

interface AddToCartParams extends Omit<CartItem, 'quantity'> {
  quantity?: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: AddToCartParams) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
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
  const [items, setItems] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = ({ quantity = 1, ...item }: AddToCartParams) => {
    setItems((prev) => {
      if (item.stock <= 0) {
        toast({ title: 'Out of stock', description: `${item.name} is currently out of stock.`, variant: 'destructive' });
        return prev;
      }

      // Generate unique cart item ID based on product + variant
      const cartItemId = item.variant_id ? `${item.id}-${item.variant_id}` : item.id;

      const existing = prev.find((i) => {
        const existingCartId = i.variant_id ? `${i.id}-${i.variant_id}` : i.id;
        return existingCartId === cartItemId;
      });

      if (existing) {
        const newQuantity = existing.quantity + quantity;
        if (newQuantity > item.stock) {
          toast({ title: 'Stock limit reached', description: `You can only add up to ${item.stock} of ${item.name}.`, variant: 'destructive' });
          return prev;
        }
        return prev.map((i) => {
          const existingCartId = i.variant_id ? `${i.id}-${i.variant_id}` : i.id;
          return existingCartId === cartItemId ? { ...i, quantity: newQuantity } : i;
        });
      }
      
      if (quantity > item.stock) {
        toast({ title: 'Stock limit reached', description: `You can only add up to ${item.stock} of ${item.name}.`, variant: 'destructive' });
        return prev;
      }
      return [...prev, { ...item, quantity }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((item) => {
      const cartItemId = item.variant_id ? `${item.id}-${item.variant_id}` : item.id;
      return cartItemId !== id;
    }));
  };

  const updateQuantity = (id: string, quantity: number) => {
    const itemToUpdate = items.find(item => {
      const cartItemId = item.variant_id ? `${item.id}-${item.variant_id}` : item.id;
      return cartItemId === id;
    });
    
    if (itemToUpdate && quantity > itemToUpdate.stock) {
        toast({ title: 'Stock limit reached', description: `You can only add up to ${itemToUpdate.stock} of ${itemToUpdate.name}.`, variant: 'destructive' });
        setItems(prev => prev.map(item => {
          const cartItemId = item.variant_id ? `${item.id}-${item.variant_id}` : item.id;
          return cartItemId === id ? { ...item, quantity: itemToUpdate.stock } : item;
        }));
        return;
    }
    
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        const cartItemId = item.variant_id ? `${item.id}-${item.variant_id}` : item.id;
        return cartItemId === id ? { ...item, quantity } : item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
