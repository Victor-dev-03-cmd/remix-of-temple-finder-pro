import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  CreditCard, 
  ArrowLeft, 
  Trash,
  Package
} from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { getCategoryLabel } from '@/lib/categories';

const CartPage = () => {
  // Accessing functions from your CartContext.tsx
  const { 
    items, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    totalItems, 
    totalPrice 
  } = useCart();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-grow container py-8 px-4 sm:py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Top Actions */}
          <div className="flex items-center justify-between">
            <Link 
              to="/products" 
              className="group flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Continue Shopping
            </Link>
            
            {items.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearCart}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/5"
              >
                <Trash className="mr-2 h-4 w-4" />
                Empty Cart
              </Button>
            )}
          </div>

          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm sm:border sm:border-border overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
                Your Shopping Cart
                {items.length > 0 && (
                  <Badge variant="secondary" className="ml-auto rounded-full px-3">
                    {totalItems} {totalItems === 1 ? 'Item' : 'Items'}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <AnimatePresence mode="popLayout">
                {items.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-16 text-center"
                  >
                    <div className="flex justify-center mb-6 text-muted-foreground/20">
                      <ShoppingBag className="h-20 w-20" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
                    <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
                      Explore our collection and add some items to your cart!
                    </p>
                    <Link to="/products">
                      <Button className="rounded-full px-10 h-12 shadow-lg shadow-primary/20">
                        Start Shopping
                      </Button>
                    </Link>
                  </motion.div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {items.map((item) => (
                      <motion.div 
                        key={item.cartItemId}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-6"
                      >
                        {/* Image */}
                        <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-muted border border-border">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="h-full w-full object-cover transition-transform hover:scale-110"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package className="h-8 w-8 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-lg leading-tight truncate pr-2">{item.name}</h3>
                              {item.variant_name && (
                                <Badge variant="outline" className="mt-1 font-semibold text-primary/80 border-primary/20 bg-primary/5">
                                  {item.variant_name}
                                </Badge>
                              )}
                              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 block">
                                {getCategoryLabel(item.category)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg text-foreground">
                                LKR {(item.price * item.quantity).toLocaleString()}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                LKR {item.price.toLocaleString()} / unit
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            {/* Quantity Switcher - Uses cartItemId from your Context */}
                            <div className="flex items-center bg-muted/50 rounded-xl p-1 border border-border">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg hover:bg-background shadow-sm"
                                onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </Button>
                              
                              <span className="w-10 text-center text-sm font-bold">
                                {item.quantity}
                              </span>
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg hover:bg-background shadow-sm"
                                onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                                disabled={item.quantity >= item.stock}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                            </div>

                            {/* Remove - Uses cartItemId from your Context */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-destructive transition-colors rounded-full"
                              onClick={() => removeFromCart(item.cartItemId)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              <span className="text-xs font-medium">Remove</span>
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </CardContent>

            {items.length > 0 && (
              <CardFooter className="flex flex-col items-end gap-6 bg-muted/30 pt-8 border-t border-border">
                <div className="w-full max-w-sm space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="text-foreground font-medium">LKR {totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Shipping</span>
                      <span className="text-green-600 font-bold text-xs uppercase tracking-tighter">Free Shipping</span>
                    </div>
                  </div>
                  
                  <Separator className="bg-border/60" />
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="font-bold text-xl">Total</span>
                    <span className="font-black text-3xl text-primary leading-none">
                      LKR {totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="w-full max-w-sm">
                  <Link to="/checkout" className="w-full">
                    <Button className="w-full h-14 rounded-2xl text-lg font-bold shadow-2xl shadow-primary/20 transition-transform hover:scale-[1.01] active:scale-[0.99]">
                      <CreditCard className="mr-3 h-5 w-5" />
                      Proceed to Checkout
                    </Button>
                  </Link>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CartPage;