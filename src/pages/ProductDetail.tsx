import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
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

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
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
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: '',
  });

  useEffect(() => {
    if (variants.length > 0 && !selectedVariant) {
      setSelectedVariant(variants[0]);
    }
  }, [variants, selectedVariant]);

  const isAdded = () => {
    if (!product) return false;
    const cartItemId = selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id;
    return items.some(item => item.cartItemId === cartItemId);
  };

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setQuantity(1);
  };

  const getCurrentPrice = () => selectedVariant ? selectedVariant.price : (product?.price || 0);
  const getCurrentStock = () => selectedVariant ? selectedVariant.stock : (product?.stock || 0);
  const getCurrentSKU = () => (selectedVariant && selectedVariant.sku) ? selectedVariant.sku : "N/A";

  const handleAddToCart = () => {
    if (!product) return;
    const currentStock = getCurrentStock();
    if (currentStock === 0) {
      toast({ title: 'Out of Stock', variant: 'destructive' });
      return;
    }
    
    addToCart({
      id: product.id,
      name: product.name,
      price: getCurrentPrice(),
      image_url: product.image_url || undefined,
      vendor_id: product.vendor_id,
      stock: currentStock,
      quantity: quantity,
      category: product.category,
      variant_id: selectedVariant?.id,
      variant_name: selectedVariant?.name,
    });
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

  const currentPrice = getCurrentPrice();
  const currentStock = getCurrentStock();
  const currentSKU = getCurrentSKU();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 px-4 sm:py-8">
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
              <div ref={variantSectionRef} className="space-y-3">
                <h3 className="font-medium text-foreground flex items-center gap-2"><Tag className="h-4 w-4" />Select Variant</h3>
                <div className="flex flex-wrap gap-2"> 
                  {variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => handleVariantSelect(variant)}
                      className={`relative w-fit rounded-lg border-2 p-2 pr-8 text-left transition-all ${
                        selectedVariant?.id === variant.id ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border'
                      } ${variant.stock === 0 ? 'opacity-50' : ''}`}
                      disabled={variant.stock === 0}
                    >
                      <p className="font-medium text-sm">{variant.name}</p>
                      <p className="text-xs font-semibold text-primary">LKR {variant.price.toLocaleString()}</p>
                      {selectedVariant?.id === variant.id && ( <Check className="absolute top-1/2 -translate-y-1/2 right-2 h-3.5 w-3.5 text-primary" /> )}
                    </button>
                  ))}
                </div>
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
                  
                  <Link to="/cart" className="w-full order-2">
                    <Button variant="outline" size="lg" className="w-full gap-2 text-base font-semibold bg-amber-400 hover:bg-amber-500 text-black border-none">
                      <Eye className="h-5 w-5" /> View Cart
                    </Button>
                  </Link>
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
    </div>
  );
};

export default ProductDetail;