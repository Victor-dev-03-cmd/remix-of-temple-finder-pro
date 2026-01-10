import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Phone, Star, ArrowLeft, Package, Clock, Loader2, 
  ChevronUp, ChevronDown, MessageSquare, Eye, EyeOff, Trash2, Edit3,
  Image as ImageIcon, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/products/ProductCard';
import TempleReviewForm from '@/components/temples/TempleReviewForm';
import TempleBookingForm from '@/components/temples/TempleBookingForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useTemple } from '@/hooks/useTemples';
import { useTempleProducts } from '@/hooks/useTempleProducts';
import { useTempleReviews } from '@/hooks/useTempleReviews';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// --- Review Card Component ---
const ReviewCard = ({ 
  review, 
  onUpdate,
  onEdit,
  onViewFull
}: { 
  review: any, 
  onUpdate: () => void, 
  onEdit: (review: any) => void,
  onViewFull: (review: any) => void
}) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const textLimit = 130; 

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, []);

  const displayName = review.profile?.full_name || review.user_name || 'Anonymous Devotee';
  const isOwner = currentUserId === review.user_id;

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('temple_reviews').delete().eq('id', review.id);
      if (error) throw error;
      toast.success("Review deleted successfully");
      onUpdate(); 
    } catch (error: any) {
      toast.error(error.message || "Failed to delete review");
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary shrink-0 border border-primary/20">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden min-w-0">
            <h4 className="font-semibold text-sm truncate text-foreground">{displayName}</h4>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={12} className={i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/30"} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {isOwner && (
            <button onClick={() => onEdit(review)} className="text-muted-foreground hover:text-primary p-1.5 hover:bg-primary/10 rounded-md transition-colors">
              <Edit3 size={16} />
            </button>
          )}
          <button onClick={() => onViewFull(review)} className="text-muted-foreground hover:text-primary p-1.5 hover:bg-muted rounded-md transition-colors">
            <Eye size={18} />
          </button>
          {isOwner && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="text-muted-foreground hover:text-destructive p-1.5 hover:bg-destructive/10 rounded-md transition-colors">
                  <Trash2 size={16} />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete your review.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
      
      <div className="line-clamp-3">
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{review.comment}</p>
      </div>
    </motion.div>
  );
};

// --- Review Detail Drawer Component ---
const ReviewDetailDrawer = ({
  review,
  open,
  onOpenChange,
  onUpdate,
  onEdit
}: {
  review: any | null,
  open: boolean,
  onOpenChange: (open: boolean) => void,
  onUpdate: () => void,
  onEdit: (review: any) => void
}) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, []);

  if (!review) return null;

  const displayName = review.profile?.full_name || review.user_name || 'Anonymous Devotee';
  const isOwner = currentUserId === review.user_id;

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('temple_reviews').delete().eq('id', review.id);
      if (error) throw error;
      toast.success("Review deleted successfully");
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete review");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-96">
        <SheetHeader className="mb-6">
          <SheetTitle>Full Review</SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Reviewer Info */}
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary border border-primary/20 text-lg">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{displayName}</h3>
              <div className="flex gap-0.5 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className={i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/30"} />
                ))}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Full Review Text */}
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase">Review</h4>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {review.comment}
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {isOwner && (
              <>
                <Button
                  onClick={() => {
                    onEdit(review);
                    onOpenChange(false);
                  }}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <Edit3 size={16} />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="flex-1 gap-2">
                      <Trash2 size={16} />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently delete your review.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const TempleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: temple, isLoading, error } = useTemple(id || '');
  const { data: reviews = [], isLoading: reviewsLoading, refetch: refetchReviews } = useTempleReviews(id || '');
  const { products, loading: productsLoading } = useTempleProducts(id);
  
  // Fetch gallery images from database
  const { data: galleryImagesData = [] } = useQuery({
    queryKey: ['temple-gallery', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('temple_gallery_images')
        .select('*')
        .eq('temple_id', id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(true);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [formKey, setFormKey] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) setCurrentUserId(data.user.id); });
  }, []);

  useEffect(() => {
    if (currentUserId) {
      const userHasReviewed = reviews.some((r: any) => r.user_id === currentUserId);
      if (userHasReviewed && !editingReview) {
        setShowReviewForm(false);
      } else if (!userHasReviewed && editingReview) {
        // If user no longer has a review but we were editing one, reset edit mode
        setEditingReview(null);
      }
    }
  }, [currentUserId, reviews, editingReview]);

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!temple || error) return <div className="flex min-h-screen items-center justify-center p-4"><h1>Temple Not Found</h1></div>;

  const handleReviewSuccess = () => {
    refetchReviews();
    setFormKey(prev => prev + 1);
    setShowReviewForm(false); 
    setEditingReview(null);
  };

  const handleEditReview = (review: any) => {
    setEditingReview(review);
    setShowReviewForm(true); 
    document.getElementById('review-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Combine main temple image with gallery images
  const galleryImages = [
    temple.image,
    ...galleryImagesData.map((img: any) => img.image_url)
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative h-[45vh] min-h-[350px] overflow-hidden">
        <div className="absolute inset-0">
          <img src={temple.image} alt={temple.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>
        <div className="container relative flex h-full flex-col justify-end pb-8">
          <Link to="/temples" className="mb-4 inline-flex">
            <Button variant="outline" size="sm" className="gap-2 bg-background/20 backdrop-blur-md border-white/20 text-white">
              <ArrowLeft size={16} /> Back
            </Button>
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="mb-2 font-display text-4xl font-semibold text-white sm:text-6xl drop-shadow-md">{temple.name}</h1>
              <div className="flex items-center gap-2 text-white/90 font-medium mt-2"><MapPin size={16} className="text-primary" /> <span>{temple.district}, {temple.province}</span></div>
            </div>
            <TempleBookingForm templeId={temple.id} templeName={temple.name} />
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container">
          {/* Main Grid: Desktop order handled by grid, Mobile order by 'order-x' */}
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-10">
            
            {/* --- Left Column Group --- */}
            <div className="lg:col-span-2 flex flex-col gap-12 contents lg:flex">
              
              {/* 1. About the Temple (Order 1 Mobile) */}
              <div className="space-y-4 order-1">
                <h2 className="font-display text-2xl font-semibold flex items-center gap-2">
                  <div className="h-8 w-1 bg-primary rounded-full" /> About the Temple
                </h2>
                <p className={`text-muted-foreground leading-relaxed text-lg transition-all duration-300 ${!isAboutExpanded ? 'line-clamp-[6]' : ''}`}>
                  {temple.description}
                </p>
                {temple.description?.length > 400 && (
                  <button onClick={() => setIsAboutExpanded(!isAboutExpanded)} className="text-primary font-bold text-sm hover:underline">
                    {isAboutExpanded ? "Read Less" : "Read Full History..."}
                  </button>
                )}
              </div>

              {/* 4. Temple Gallery (Order 4 Mobile) */}
              <div className="space-y-6 order-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-2xl font-semibold flex items-center gap-2">
                    <ImageIcon className="text-primary" size={24} /> Temple Gallery
                  </h3>
                  <div className="text-sm text-muted-foreground font-medium">
                    {currentImageIndex + 1} / {galleryImages.length}
                  </div>
                </div>

                {/* Main Gallery Carousel */}
                <div className="relative group">
                  {/* Main Image Container */}
                  <div className="relative h-[300px] sm:h-[450px] w-full overflow-hidden rounded-3xl shadow-2xl bg-muted">
                    <AnimatePresence mode="wait">
                      {galleryImages.map((img, idx) => {
                        if (idx !== currentImageIndex) return null;
                        return (
                          <motion.div
                            key={img}
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            className="absolute inset-0 w-full h-full"
                          >
                            <img
                              src={img}
                              alt={`Temple gallery ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <motion.button
                      onClick={() => setCurrentImageIndex(prev => (prev - 1 + galleryImages.length) % galleryImages.length)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-all backdrop-blur-sm group-hover:bg-black/50"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ChevronLeft size={24} />
                    </motion.button>
                    <motion.button
                      onClick={() => setCurrentImageIndex(prev => (prev + 1) % galleryImages.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-all backdrop-blur-sm group-hover:bg-black/50"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ChevronRight size={24} />
                    </motion.button>
                  </div>

                  {/* Image Indicators/Dots */}
                  {galleryImages.length > 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-center gap-2 mt-6"
                    >
                      {galleryImages.map((_, idx) => (
                        <motion.button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`rounded-full transition-all ${
                            idx === currentImageIndex
                              ? 'bg-primary w-8 h-2'
                              : 'bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2 h-2'
                          }`}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                        />
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* 7. Devotee Experiences (Order 7 Mobile) */}
              <div className="pt-8 border-t space-y-6 order-7">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-2xl font-semibold flex items-center gap-2"><MessageSquare className="text-primary" size={24} /> Devotee Experiences</h3>
                  <Badge variant="secondary">{reviews.length} Reviews</Badge>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                    {reviews.map((review: any) => (
                      <ReviewCard 
                        key={review.id} 
                        review={review} 
                        onUpdate={refetchReviews} 
                        onEdit={handleEditReview}
                        onViewFull={(review) => {
                          setSelectedReview(review);
                          setIsDrawerOpen(true);
                        }}
                      />
                    ))}
                </div>
              </div>
            </div>

            {/* --- Sidebar Group --- */}
            <div className="flex flex-col gap-6 contents lg:flex">
              
              {/* 2. Contact Info (Order 2 Mobile) */}
              <div className="order-2 rounded-2xl border p-6 bg-card shadow-sm space-y-5">
                <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2"><Phone size={18} className="text-primary"/> Contact Info</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/40">
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary"><Phone size={18}/></div>
                    <div><p className="text-[10px] text-muted-foreground font-bold uppercase">Phone</p><p className="font-bold">{temple.contact || 'N/A'}</p></div>
                  </div>
                  <div className="flex items-start gap-4 p-3 rounded-xl bg-muted/40">
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0"><Clock size={18}/></div>
                    <div><p className="text-[10px] text-muted-foreground font-bold uppercase">Timing</p><p className="text-sm font-semibold">Morning: 06:00 AM - 12:00 PM</p><p className="text-sm font-semibold">Evening: 04:30 PM - 08:30 PM</p></div>
                  </div>
                </div>
              </div>

              {/* 3. Location (Order 3 Mobile) */}
              <div className="order-3 rounded-2xl border p-6 bg-card shadow-sm space-y-4">
                <h3 className="font-semibold text-lg">Location</h3>
                <div onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(temple.name)}`, '_blank')} className="aspect-video rounded-xl relative overflow-hidden cursor-pointer border shadow-inner bg-slate-100 flex items-center justify-center">
                   <div className="bg-primary p-3 rounded-full shadow-lg"><MapPin className="h-6 w-6 text-white" /></div>
                </div>
                <p className="text-sm text-muted-foreground font-medium">{temple.address || temple.district}</p>
              </div>

              {/* 6. Share Experience Form (Order 6 Mobile) */}
              <div id="review-section" className="order-6 rounded-2xl border bg-primary/5 p-6 border-primary/20 shadow-lg relative overflow-hidden h-fit">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2 text-primary"><Star className="fill-primary" size={20} /> {editingReview ? 'Edit Review' : 'Share Experience'}</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowReviewForm(!showReviewForm)}>{showReviewForm ? <ChevronUp /> : <ChevronDown />}</Button>
                </div>
                <AnimatePresence>
                  {showReviewForm && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                      <TempleReviewForm 
                        key={formKey} 
                        templeId={id!} 
                        editingReview={editingReview} 
                        onSuccess={handleReviewSuccess}
                        onCancel={() => setEditingReview(null)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                {!showReviewForm && <p className="text-xs text-muted-foreground">Thank you for sharing your experience!</p>}
              </div>
            </div>

            {/* 5. Products Section (Order 5 Mobile) */}
            <div className="lg:col-span-3 order-5 py-10 border-t bg-muted/20 -mx-4 px-4 sm:mx-0 sm:px-0 sm:rounded-3xl">
              <h2 className="font-display text-2xl font-semibold text-center mb-10">Available Temple Products</h2>
              <div className="grid gap-6 grid-cols-2 sm:grid-cols-4 lg:grid-cols-6">
                {productsLoading ? <Skeleton className="h-48 w-full" /> : products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Review Detail Drawer */}
      <ReviewDetailDrawer 
        review={selectedReview}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onUpdate={refetchReviews}
        onEdit={handleEditReview}
      />

      <Footer />
    </div>
  );
};

export default TempleDetail;