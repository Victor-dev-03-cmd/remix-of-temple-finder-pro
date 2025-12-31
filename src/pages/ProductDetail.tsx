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
  Tag
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
  const [isAdded, setIsAdded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: '',
  });

  // Set default variant when variants load
  useEffect(() => {
    if (variants.length > 0 && !selectedVariant) {
      setSelectedVariant(variants[0]);
    }
  }, [variants, selectedVariant]);

  useEffect(() => {
    if (product) {
      const isInCart = items.some((item) => item.id === product.id);
      setIsAdded(isInCart);
    }
  }, [items, product]);

  const scrollToVariants = () => {
    variantSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setQuantity(1);
  };

  const getCurrentPrice = () => {
    if (selectedVariant) return selectedVariant.price;
    return product?.price || 0;
  };

  const getCurrentStock = () => {
    if (selectedVariant) return selectedVariant.stock;
    return product?.stock || 0;
  };

  const handleAddToCart = () => {
    if (!product) return;

    const currentStock = getCurrentStock();
    if (currentStock === 0) {
      toast({
        title: 'Out of Stock',
        description: 'This item is currently out of stock.',
        variant: 'destructive',
      });
      return;
    }
    
    addToCart({
      id: selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id,
      name: selectedVariant ? `${product.name} - ${selectedVariant.name}` : product.name,
      price: getCurrentPrice(),
      image_url: product.image_url || undefined,
      vendor_id: product.vendor_id,
      stock: currentStock,
      quantity: quantity,
      variant_id: selectedVariant?.id,
      variant_name: selectedVariant?.name,
    });
    setIsAdded(true);
    toast({
      title: 'Added to Cart',
      description: `${product.name}${selectedVariant ? ` - ${selectedVariant.name}` : ''} added to your cart.`,
    });
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) {
      toast({
        title: 'Please sign in',
        description: 'You need to be signed in to leave a review.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createReview.mutateAsync({
        product_id: id,
        user_id: user.id,
        rating: reviewForm.rating,
        title: reviewForm.title || null,
        comment: reviewForm.comment || null,
      });
      
      toast({
        title: 'Review submitted',
        description: 'Thank you for your feedback!',
      });
      
      setShowReviewForm(false);
      setReviewForm({ rating: 5, title: '', comment: '' });
      refetchReviews();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to submit review. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Filter out current product from related
  const filteredRelated = relatedProducts.filter((p) => p.id !== id).slice(0, 4);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6 px-4 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            <Skeleton className="aspect-square rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container flex flex-col items-center justify-center py-16 px-4">
          <Package className="mb-4 h-16 w-16 text-muted-foreground" />
          <h1 className="mb-2 text-2xl font-bold text-foreground">Product Not Found</h1>
          <p className="mb-4 text-muted-foreground text-center">
            {error || "The product you're looking for doesn't exist."}
          </p>
          <Link to="/products">
            <Button>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const currentPrice = getCurrentPrice();
  const currentStock = getCurrentStock();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 px-4 sm:py-8">
        {/* Breadcrumb */}
        <nav className="mb-4 sm:mb-6">
          <Link
            to="/products"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Products
          </Link>
        </nav>

        {/* Product Details */}
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="overflow-hidden rounded-xl border border-border bg-muted"
          >
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover aspect-square"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center">
                <Package className="h-24 w-24 text-muted-foreground" />
              </div>
            )}
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-5"
          >
            <div>
              <p className="mb-1 text-sm font-medium text-primary">{getCategoryLabel(product.category)}</p>
              <h1 className="mb-2 font-display text-2xl sm:text-3xl font-bold text-foreground">
                {product.name}
              </h1>
              
              {/* Temple Info */}
              {product.temple && (
                <Link 
                  to={`/temples/${product.temple.id}`}
                  className="mb-3 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-sm text-primary hover:bg-primary/20 transition-colors"
                >
                  <Store className="h-4 w-4" />
                  <span>From {product.temple.name}</span>
                </Link>
              )}
              
              {/* Rating */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 sm:h-5 sm:w-5 ${
                        i < Math.round(averageRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-bold text-primary">
                LKR {currentPrice.toLocaleString()}
              </p>
              {selectedVariant && product.price !== selectedVariant.price && (
                <p className="text-lg text-muted-foreground line-through">
                  LKR {product.price.toLocaleString()}
                </p>
              )}
            </div>

            {product.description && (
              <div>
                <h3 className="mb-2 font-medium text-foreground">Description</h3>
                <p className="text-muted-foreground text-sm sm:text-base">{product.description}</p>
              </div>
            )}

            {/* Variant Selection */}
            {variants.length > 0 && (
              <div ref={variantSectionRef} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Select Variant
                  </h3>
                  {selectedVariant && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedVariant.name}
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <AnimatePresence mode="popLayout">
                    {variants.map((variant) => (
                      <motion.button
                        key={variant.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={() => handleVariantSelect(variant)}
                        className={`relative rounded-lg border-2 p-3 text-left transition-all ${
                          selectedVariant?.id === variant.id
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        } ${variant.stock === 0 ? 'opacity-50' : ''}`}
                        disabled={variant.stock === 0}
                      >
                        <p className="font-medium text-sm text-foreground truncate">
                          {variant.name}
                        </p>
                        <p className="text-sm font-semibold text-primary mt-1">
                          LKR {variant.price.toLocaleString()}
                        </p>
                        <p className={`text-xs mt-1 ${
                          variant.stock > 5 
                            ? 'text-green-600 dark:text-green-400' 
                            : variant.stock > 0 
                            ? 'text-amber-600 dark:text-amber-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {variant.stock > 5 ? 'In Stock' : variant.stock > 0 ? `Only ${variant.stock} left` : 'Out of Stock'}
                        </p>
                        {selectedVariant?.id === variant.id && (
                          <motion.div
                            layoutId="variant-check"
                            className="absolute top-2 right-2"
                          >
                            <Check className="h-4 w-4 text-primary" />
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  currentStock > 5
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : currentStock > 0
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
                {currentStock > 5
                  ? 'In Stock'
                  : currentStock > 0
                  ? `Only ${currentStock} left`
                  : 'Out of Stock'}
              </span>
            </div>

            <Separator />

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <Label className="text-foreground">Quantity:</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                    disabled={quantity >= currentStock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {variants.length > 0 && !selectedVariant ? (
                  <Button
                    size="lg"
                    className="flex-1 gap-2"
                    onClick={scrollToVariants}
                  >
                    <Tag className="h-5 w-5" />
                    Select a Variant
                  </Button>
                ) : isAdded ? (
                  <Link to="/cart" className="flex-1">
                    <Button size="lg" className="w-full gap-2">
                      <Check className="h-5 w-5" />
                      View Cart
                    </Button>
                  </Link>
                ) : (
                  <Button
                    size="lg"
                    className="flex-1 gap-2"
                    onClick={handleAddToCart}
                    disabled={currentStock === 0}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {currentStock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </Button>
                )}
                <Button variant="outline" size="lg" className="sm:w-auto">
                  <Heart className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 sm:mt-16"
        >
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Customer Reviews
            </h2>
            {user && !showReviewForm && (
              <Button onClick={() => setShowReviewForm(true)} size="sm">Write a Review</Button>
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-8 rounded-lg border border-border bg-card p-4 sm:p-6"
            >
              <h3 className="mb-4 font-medium text-foreground">Write Your Review</h3>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="space-y-2">
                  <Label>Rating</Label>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: i + 1 })}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-6 w-6 transition-colors ${
                            i < reviewForm.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground hover:text-yellow-400'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="review-title">Title (optional)</Label>
                  <Input
                    id="review-title"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                    placeholder="Summarize your experience"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="review-comment">Your Review</Label>
                  <Textarea
                    id="review-comment"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    placeholder="Share your thoughts about this product..."
                    rows={4}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button type="submit" disabled={createReview.isPending}>
                    {createReview.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Review
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowReviewForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Reviews List */}
          {reviewsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border p-4">
                  <Skeleton className="mb-2 h-4 w-24" />
                  <Skeleton className="mb-2 h-5 w-48" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-12 text-center">
              <Star className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
              {!user && (
                <Link to="/auth" className="mt-2 inline-block">
                  <Button variant="link">Sign in to write a review</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {review.title && (
                    <h4 className="mb-1 font-medium text-foreground">{review.title}</h4>
                  )}
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Related Products */}
        {filteredRelated.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 sm:mt-16"
          >
            <h2 className="mb-6 font-display text-xl sm:text-2xl font-bold text-foreground">
              Related Products
            </h2>
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              {filteredRelated.map((relatedProduct, index) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} index={index} />
              ))}
            </div>
          </motion.section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
