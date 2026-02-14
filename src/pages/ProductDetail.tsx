import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Heart, 
  Star, 
  ChevronLeft, 
  Minus, 
  Plus,
  Package,
  Loader2,
  Store,
  Check,
  Tag,
  Fingerprint,
  Eye
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useProduct, useProducts } from '@/hooks/useProducts';
import { useProductVariants, ProductVariant } from '@/hooks/useProductVariants';
import { useProductReviews, useCreateReview } from '@/hooks/useProductReviews';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { getCategoryLabel } from '@/lib/categories';
import { AuthModal } from '@/components/auth/AuthModal';
import { ProductVariantSelector } from '@/components/products/ProductVariantSelector';

const predefinedColors = [
  { name: 'Red', color: 'bg-red-500', hex: '#ef4444' },
  { name: 'Blue', color: 'bg-blue-500', hex: '#3b82f6' },
  { name: 'Green', color: 'bg-green-500', hex: '#22c55e' },
  { name: 'Yellow', color: 'bg-yellow-500', hex: '#eab308' },
  { name: 'Orange', color: 'bg-orange-500', hex: '#f97316' },
  { name: 'Purple', color: 'bg-purple-500', hex: '#a855f7' },
  { name: 'Pink', color: 'bg-pink-500', hex: '#ec4899' },
  { name: 'Indigo', color: 'bg-indigo-500', hex: '#6366f1' },
  { name: 'Teal', color: 'bg-teal-500', hex: '#14b8a6' },
  { name: 'Cyan', color: 'bg-cyan-500', hex: '#06b6d4' },
  { name: 'Black', color: 'bg-black', hex: '#000000' },
  { name: 'White', color: 'bg-white border border-border', hex: '#ffffff' },
  { name: 'Gray', color: 'bg-gray-500', hex: '#6b7280' },
  { name: 'Gold', color: 'bg-amber-400', hex: '#fbbf24' },
  { name: 'Silver', color: 'bg-gray-300', hex: '#d1d5db' },
  { name: 'Bronze', color: 'bg-amber-700', hex: '#b45309' },
  { name: 'Rose Gold', color: 'bg-rose-300', hex: '#fda4af' },
  { name: 'Navy', color: 'bg-blue-900', hex: '#1e3a8a' },
  { name: 'Maroon', color: 'bg-red-900', hex: '#7f1d1d' },
  { name: 'Olive', color: 'bg-lime-700', hex: '#4d7c0f' },
  { name: 'Beige', color: 'bg-amber-100', hex: '#fef3c7' },
  { name: 'Cream', color: 'bg-orange-50', hex: '#fff7ed' },
  { name: 'Brown', color: 'bg-amber-800', hex: '#92400e' },
  { name: 'Charcoal', color: 'bg-gray-800', hex: '#1f2937' },
];

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { product, loading, error } = useProduct(id);
  const { variants, loading: variantsLoading } = useProductVariants(id);
  const { reviews, loading: reviewsLoading, averageRating, refetch: refetchReviews } = useProductReviews(id);
  const { products: relatedProducts } = useProducts({ 
    category: product?.category, 
    limit: 4 
  });
  const { addToCart, items } = useCart();
  const { user } = useAuth();
  const createReview = useCreateReview();
  const variantSectionRef = useRef<HTMLDivElement>(null);

  const [quantity, setQuantity] = useState(1);
  
  // Split state for Size and Color
  const [selectedSize, setSelectedSize] = useState<ProductVariant | null>(null);
  const [selectedColor, setSelectedColor] = useState<ProductVariant | null>(null);
  
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isVariantSelectorOpen, setIsVariantSelectorOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: '',
  });

  // Group variants by type (Color vs Others)
  const { colorVariants, otherVariants } = useMemo(() => {
    const colors: ProductVariant[] = [];
    const others: ProductVariant[] = [];

    variants.forEach(v => {
      const isColor = predefinedColors.some(c => c.name.toLowerCase() === v.name.toLowerCase());
      if (isColor) {
        colors.push(v);
      } else {
        others.push(v);
      }
    });

    return { colorVariants: colors, otherVariants: others };
  }, [variants]);

  useEffect(() => {
    // Auto-select first options if available and not yet selected
    if (otherVariants.length > 0 && !selectedSize) {
      setSelectedSize(otherVariants[0]);
    }
    if (colorVariants.length > 0 && !selectedColor) {
      setSelectedColor(colorVariants[0]);
    }
  }, [otherVariants, colorVariants, selectedSize, selectedColor]);

  const isAdded = () => {
    if (!product) return false;
    // Construct cart item ID based on selection
    let cartItemId = product.id;
    if (selectedSize) {
      cartItemId = `${product.id}-${selectedSize.id}`;
    } else if (selectedColor) {
      // If only color is selected (no size variants), use color ID? 
      // Or if we treat color as dummy, maybe just product ID?
      // For consistency with addToCart logic below:
      cartItemId = `${product.id}-${selectedColor.id}`; 
      // Note: If we pass null ID for color-only, this check might need adjustment.
      // But let's stick to using the ID of the "main" variant.
    }
    
    return items.some(item => item.cartItemId === cartItemId);
  };

  const getCurrentPrice = () => {
    if (selectedSize) return selectedSize.price;
    return product?.price || 0;
  };

  const getCurrentStock = () => {
    if (selectedSize) return selectedSize.stock;
    return product?.stock || 0;
  };
  
  const getCurrentSKU = () => {
    if (selectedSize) return selectedSize.sku || "N/A";
    return "N/A";
  };

  const currentPrice = getCurrentPrice();
  const currentStock = getCurrentStock();
  const currentSKU = getCurrentSKU();

  const handleAddToCart = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!product) return;
    
    // Determine which variant ID to use for stock/price tracking
    // We prioritize Size variant. If no Size variant, we use Color variant (if it's not dummy) or null.
    // Since we made Color variants dummy (0 price/stock), we should probably use Size variant ID if available.
    // If ONLY colors exist, we might have to use null (main product) or the color ID if the backend allows 0 stock.
    // Assuming "Size" carries the real inventory data.
    
    let finalVariantId: string | undefined = undefined;
    let finalVariantName: string | undefined = undefined;

    if (selectedSize) {
      finalVariantId = selectedSize.id;
      finalVariantName = selectedSize.name;
      if (selectedColor) {
        finalVariantName += ` - ${selectedColor.name}`;
      }
    } else if (selectedColor) {
      // Only color selected (no sizes available)
      // If colors are dummy, we might want to track against main product (undefined variant_id)
      // But we want to show the color name.
      finalVariantName = selectedColor.name;
      // We pass undefined for ID so it deducts from main product stock? 
      // Or if the user didn't create sizes, maybe the main product holds the stock.
      finalVariantId = undefined; 
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: currentPrice,
      image_url: product.image_url || undefined,
      vendor_id: product.vendor_id,
      stock: currentStock,
      quantity: quantity,
      category: product.category,
      variant_id: finalVariantId,
      variant_name: finalVariantName,
    });
  };

  const handleViewCart = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      navigate('/cart');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    try {
      await createReview.mutateAsync({
        product_id: id,
        user_id: user.id,
        rating: reviewForm.rating,
        title: reviewForm.title || null,
        comment: reviewForm.comment || null,
      });
      toast({ title: 'Review submitted' });
      setShowReviewForm(false);
      setReviewForm({ rating: 5, title: '', comment: '' });
      refetchReviews();
    } catch (err) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const filteredRelated = relatedProducts.filter((p) => p.id !== id).slice(0, 4);

  if (loading) return (
    <div className="min-h-screen bg-background"><Header /><main className="container py-8 px-4"><Skeleton className="h-[500px] w-full" /></main></div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 px-4 sm:py-8">
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        <nav className="mb-4">
          <Link to="/products" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="mr-1 h-4 w-4" /> Back to Products
          </Link>
        </nav>

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
          <div className="overflow-hidden rounded-xl border border-border bg-muted">
            {product?.image_url ? (
              <img src={product.image_url} alt={product.name} className="h-full w-full object-cover aspect-square" />
            ) : (
              <div className="flex aspect-square items-center justify-center"><Package className="h-24 w-24 text-muted-foreground" /></div>
            )}
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary uppercase tracking-wider">{getCategoryLabel(product?.category)}</p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{product?.name}</h1>
              {product?.temple && (
                <div className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-sm text-primary">
                  <Store className="h-4 w-4" /> <span>From {product.temple.name}</span>
                </div>
              )}
            </div>

            <p className="text-3xl font-bold text-primary">LKR {currentPrice.toLocaleString()}</p>

            {product?.description && (
              <div className="space-y-2">
                <h3 className="font-medium text-foreground">Description</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{product.description}</p>
              </div>
            )}

            {variants.length > 0 && (
              <div ref={variantSectionRef} className="space-y-6">
                
                {/* Size / Other Variants Selection */}
                {otherVariants.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <Tag className="h-4 w-4" /> Select Option
                    </h3>
                    <div className="grid grid-cols-3 gap-2 max-w-md">
                      {otherVariants.map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() => {
                            setSelectedSize(variant);
                            setQuantity(1);
                          }}
                          className={`relative flex flex-col items-center justify-center rounded-lg border-2 px-2 py-2 transition-all text-center ${
                            selectedSize?.id === variant.id ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border'
                          } ${variant.stock === 0 ? 'opacity-50' : ''}`}
                          disabled={variant.stock === 0}
                        >
                          <p className="font-bold text-xs line-clamp-1">{variant.name}</p>
                          {variant.price > 0 && (
                             <p className="text-[10px] font-black text-primary mt-1">LKR {variant.price.toLocaleString()}</p>
                          )}
                          {selectedSize?.id === variant.id && ( <Check className="absolute top-1 right-1 h-3 w-3 text-primary" /> )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Variants Selection */}
                {colorVariants.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <Tag className="h-4 w-4" /> Select Color
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {colorVariants.map((variant) => {
                        const colorInfo = predefinedColors.find(c => c.name.toLowerCase() === variant.name.toLowerCase());
                        const isSelected = selectedColor?.id === variant.id;
                        
                        // Always enable color buttons as they are just visual options now
                        const isAvailable = true;

                        return (
                          <button
                            key={variant.id}
                            onClick={() => {
                              setSelectedColor(variant);
                              // Don't reset quantity when changing color
                            }}
                            className={`relative group flex flex-col items-center gap-1 p-1 rounded-full transition-all ${
                              isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:scale-110'
                            } ${!isAvailable ? 'opacity-50 grayscale' : ''}`}
                            disabled={!isAvailable}
                            title={variant.name}
                          >
                            <div className={`h-8 w-8 rounded-full border shadow-sm ${colorInfo?.color || 'bg-gray-200'}`}>
                               {isSelected && (
                                 <div className="h-full w-full flex items-center justify-center">
                                   <Check className={`h-4 w-4 ${['White', 'Cream', 'Beige'].includes(colorInfo?.name || '') ? 'text-black' : 'text-white'}`} />
                                 </div>
                               )}
                            </div>
                            <span className="text-[10px] font-medium max-w-[60px] truncate">{variant.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className={`px-3 py-1 text-xs font-bold uppercase ${currentStock > 5 ? 'border-green-500 text-green-600' : currentStock > 0 ? 'border-orange-500 text-orange-600' : 'border-red-500 text-red-600'}`}>
                {currentStock > 5 ? 'In Stock' : currentStock > 0 ? `Only ${currentStock} Left` : 'Out of Stock'}
              </Badge>
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border">
                <Fingerprint className="h-3 w-3" />
                <span>SKU: <span className="text-foreground">{currentSKU}</span></span>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Label className="font-medium">Quantity:</Label>
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 border">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}><Minus className="h-4 w-4" /></Button>
                  <span className="w-8 text-center font-bold text-sm">{quantity}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQuantity(Math.min(currentStock, quantity + 1))} disabled={quantity >= currentStock}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>

              {/* MOBILE FRIENDLY ACTION BUTTONS */}
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button 
                    size="lg" 
                    className="w-full gap-2 text-base font-semibold order-1" 
                    onClick={handleAddToCart} 
                    disabled={currentStock === 0}
                  >
                    <ShoppingCart className="h-5 w-5" /> 
                    {isAdded() ? 'Add More to Cart' : 'Add to Cart'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full gap-2 text-base font-semibold bg-amber-400 hover:bg-amber-500 text-black border-none order-2"
                    onClick={handleViewCart}
                  >
                    <Eye className="h-5 w-5" /> View Cart
                  </Button>
                </div>
                
                <Button variant="outline" size="lg" className="w-full gap-2 font-medium order-3">
                  <Heart className="h-5 w-5" /> Add to Wishlist
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* CUSTOMER REVIEWS SECTION */}
        <section className="mt-16 space-y-8">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-2xl font-bold text-foreground">Customer Reviews</h2>
            {user && !showReviewForm && ( 
              <Button onClick={() => setShowReviewForm(true)} size="sm" className="rounded-full px-6">Write a Review</Button> 
            )}
          </div>

          {showReviewForm && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="space-y-2">
                  <Label>Rating</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setReviewForm({...reviewForm, rating: star})} className="transition-transform active:scale-90">
                        <Star className={`h-7 w-7 ${star <= reviewForm.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Review Title</Label>
                    <Input placeholder="Excellent product!" value={reviewForm.title} onChange={(e) => setReviewForm({...reviewForm, title: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Your Message</Label>
                  <Textarea placeholder="Tell others about your experience..." rows={4} value={reviewForm.comment} onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})} />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={createReview.isPending} className="px-8">
                    {createReview.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post Review'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowReviewForm(false)}>Cancel</Button>
                </div>
              </form>
            </motion.div>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reviewsLoading ? (
               Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
            ) : reviews.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-muted/30 rounded-2xl border border-dashed">
                <p className="text-muted-foreground italic">Be the first to share your thoughts on this product!</p>
              </div>
            ) : reviews.map((review) => (
              <div key={review.id} className="rounded-xl border p-5 bg-card hover:shadow-md transition-shadow">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />)}
                </div>
                <h4 className="font-bold text-foreground leading-tight">{review.title}</h4>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{review.comment}</p>
                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                   <span className="text-xs font-medium text-primary">Verified Purchase</span>
                   <span className="text-[10px] text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* RELATED PRODUCTS SECTION */}
        {filteredRelated.length > 0 && (
          <section className="mt-20 space-y-8">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-2xl font-bold text-foreground">Complete Your Purchase</h2>
              <Link to="/products" className="text-sm font-medium text-primary hover:underline">See All</Link>
            </div>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredRelated.map((p, idx) => (
                <ProductCard key={p.id} product={p} index={idx} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
      <ProductVariantSelector 
        product={product} 
        isOpen={isVariantSelectorOpen} 
        onClose={() => setIsVariantSelectorOpen(false)} 
      />
    </div>
  );
};

export default ProductDetail;