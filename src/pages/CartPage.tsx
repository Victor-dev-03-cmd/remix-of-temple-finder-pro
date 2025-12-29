import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, CreditCard } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getCategoryLabel } from '@/lib/categories';

const CartPage = () => {
  const { items, removeFromCart, updateQuantity, totalItems, totalPrice } = useCart();

  const getCartItemId = (item: typeof items[0]) => {
    return item.variant_id ? `${item.id}-${item.variant_id}` : item.id;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-6 w-6" />
              Shopping Cart
            </CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-lg font-medium">Your cart is empty</p>
                <Link to="/products">
                  <Button className="mt-4">Continue Shopping</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {items.map((item) => {
                  const cartItemId = getCartItemId(item);
                  return (
                    <div key={cartItemId} className="flex items-start gap-4">
                      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        {item.variant_name && (
                          <p className="text-sm text-primary">{item.variant_name}</p>
                        )}
                        {item.category && (
                          <p className="text-sm text-muted-foreground">
                            {getCategoryLabel(item.category)}
                          </p>
                        )}
                        <p className="mt-1 text-lg font-semibold text-primary">
                          LKR {item.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(cartItemId, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(cartItemId, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeFromCart(cartItemId)}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
          {items.length > 0 && (
            <CardFooter className="flex flex-col items-end gap-4 pt-6">
              <Separator />
              <div className="w-full max-w-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({totalItems} items)</span>
                  <span>LKR {totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-xs text-muted-foreground">Calculated at checkout</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>LKR {totalPrice.toLocaleString()}</span>
                </div>
              </div>
              <Link to="/checkout" className="w-full max-w-sm">
                <Button size="lg" className="w-full">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Proceed to Checkout
                </Button>
              </Link>
            </CardFooter>
          )}
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default CartPage;
