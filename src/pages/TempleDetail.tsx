import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Phone, Star, ArrowLeft, Package, Clock, Loader2, 
  ChevronUp, ChevronDown, MessageSquare, Eye, EyeOff, Trash2, Edit3,
  Image as ImageIcon, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/products/ProductCard';
import TempleReviewForm from '@/components/temples/TempleReviewForm';
import TempleBookingForm from '@/components/temples/TempleBookingForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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

// --- Review Card Component with Mutual Exclusion ---
const ExpandableReviewCard = ({ 
  review, 
  onUpdate, 
  isExpanded, 
  onToggle,
  onEdit 
}: { 
  review: any, 
  onUpdate: () => void, 
  isExpanded: boolean, 
  onToggle: () => void,
  onEdit: (review: any) => void
}) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const textLimit = 130; 
  const shouldTruncate = review.comment?.length > textLimit;

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
      className={`flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-all duration-300 ${isExpanded ? 'ring-2 ring-primary/40 shadow-md bg-primary/5' : ''}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary shrink-0 border border-primary/20">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <h4 className="font-semibold text-sm truncate text-foreground">{displayName}</h4>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={12} className={i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/30"} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isOwner && (
            <button onClick={() => onEdit(review)} className="text-muted-foreground hover:text-primary p-1.5 hover:bg-primary/10 rounded-md transition-colors">
              <Edit3 size={16} />
            </button>
          )}
          {shouldTruncate && (
            <button onClick={onToggle} className="text-muted-foreground hover:text-primary p-1.5 hover:bg-muted rounded-md transition-colors">
              {isExpanded ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
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
      
      <motion.div initial={false} animate={{ height: isExpanded ? 'auto' : '60px' }} className="overflow-hidden">
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{review.comment}</p>
      </motion.div>
      
      {!isExpanded && shouldTruncate && (
        <button className="text-primary text-[11px] font-bold mt-2 text-left hover:underline" onClick={onToggle}>
          Read more...
        </button>
      )}
    </motion.div>
  );
};

const TempleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: temple, isLoading, error } = useTemple(id || '');
  const { data: reviews = [], isLoading: reviewsLoading, refetch: refetchReviews } = useTempleReviews(id || '');
  const { products, loading: productsLoading } = useTempleProducts(id);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(true);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [formKey, setFormKey] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) setCurrentUserId(data.user.id); });
  }, []);

  useEffect(() => {
    if (currentUserId && reviews.length > 0) {
      const userHasReviewed = reviews.some((r: any) => r.user_id === currentUserId);
      if (userHasReviewed && !editingReview) setShowReviewForm(false);
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

  const galleryImages = (temple.gallery_images && temple.gallery_images.length > 0) ? temple.gallery_images : [temple.image];

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
                  <h3 className="font-display text-2xl font-semibold flex items-center gap-2"><ImageIcon className="text-primary" size={24} /> Temple Gallery</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setCurrentImageIndex(prev => (prev - 1 + galleryImages.length) % galleryImages.length)}><ChevronLeft size={18}/></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setCurrentImageIndex(prev => (prev + 1) % galleryImages.length)}><ChevronRight size={18}/></Button>
                  </div>
                </div>
                <div className="relative h-[300px] sm:h-[400px] w-full flex items-center justify-center">
                    <AnimatePresence mode="popLayout">
                      {galleryImages.map((img, idx) => {
                        if (idx !== currentImageIndex) return null;
                        return (
                          <motion.div key={img} initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }} transition={{ type: "spring", stiffness: 200, damping: 25 }} className="absolute w-full h-full rounded-3xl overflow-hidden border-4 border-white shadow-2xl">
                            <img src={img} className="w-full h-full object-cover" alt="Temple" />
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
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
                      <ExpandableReviewCard 
                        key={review.id} review={review} onUpdate={refetchReviews} 
                        isExpanded={expandedReviewId === review.id} 
                        onToggle={() => setExpandedReviewId(expandedReviewId === review.id ? null : review.id)}
                        onEdit={handleEditReview}
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
                      <TempleReviewForm key={formKey} templeId={id!} initialData={editingReview} onSuccess={handleReviewSuccess} />
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

      <Footer />
    </div>
  );
};

export default TempleDetail;