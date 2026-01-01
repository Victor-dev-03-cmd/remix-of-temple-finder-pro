import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Phone, Star, ArrowLeft, Package, Clock, Loader2, 
  ExternalLink, ChevronUp, ChevronDown, MessageSquare, Eye, EyeOff, Trash2 
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

const ExpandableReviewCard = ({ review, onUpdate }: { review: any, onUpdate: () => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
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
    <div className={`flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-all duration-300 ${isExpanded ? 'ring-1 ring-primary/20' : ''}`}>
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
          {shouldTruncate && (
            <button onClick={() => setIsExpanded(!isExpanded)} className="text-muted-foreground hover:text-primary p-1.5 hover:bg-muted rounded-md">
              {isExpanded ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
          {isOwner && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="text-muted-foreground hover:text-destructive p-1.5 hover:bg-destructive/10 rounded-md">
                  <Trash2 size={16} />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your review.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[1000px]' : 'max-h-[60px]'}`}>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{review.comment}</p>
      </div>
      {!isExpanded && shouldTruncate && (
        <span className="text-primary/60 text-[10px] font-medium mt-1 cursor-pointer" onClick={() => setIsExpanded(true)}>Read more</span>
      )}
    </div>
  );
};

const TempleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: temple, isLoading, error } = useTemple(id || '');
  const { data: reviews = [], isLoading: reviewsLoading, refetch: refetchReviews } = useTempleReviews(id || '');
  const { products, loading: productsLoading } = useTempleProducts(id);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [formKey, setFormKey] = useState(0);
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!temple || error) return <div className="flex min-h-screen items-center justify-center bg-background p-4"><div className="text-center"><h1 className="mb-4 text-2xl font-semibold">Temple Not Found</h1><Link to="/temples"><Button>Browse Temples</Button></Link></div></div>;

  const handleReviewSuccess = (operation: 'create' | 'update') => {
    refetchReviews();
    if (operation === 'create') {
      setFormKey(prev => prev + 1);
    }
  };
  
  const handleReviewDelete = () => {
    refetchReviews();
    setFormKey(prev => prev + 1);
  };

  const handleMapRedirect = () => { window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${temple.name} ${temple.district}`)}`, '_blank'); };
  const galleryImages = temple.gallery_images || [temple.image];

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
            <Button variant="outline" size="sm" className="gap-2 bg-background/20 backdrop-blur-md border-white/20 text-white hover:bg-background/40">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="mb-2 font-display text-4xl font-semibold text-white sm:text-6xl drop-shadow-md">{temple.name}</h1>
              <div className="flex items-center gap-2 text-white/90 font-medium"><MapPin className="h-4 w-4 text-primary" /> <span>{temple.district}, {temple.province}</span></div>
            </div>
            <TempleBookingForm templeId={temple.id} templeName={temple.name} />
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12">
        <div className="container">
          {/* Desktop uses standard layout, Mobile uses Flex Column with Order */}
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-10">
            
            {/* LEFT COLUMN: About, Gallery (Desktop), Reviews (Desktop) */}
            <div className="lg:col-span-2 flex flex-col gap-12">
              
              {/* 1. About the Temple (Mobile Order: 1) */}
              <div className="space-y-4 order-1">
                <h2 className="font-display text-2xl font-semibold flex items-center gap-2">
                  <div className="h-8 w-1 bg-primary rounded-full" /> About the Temple
                </h2>
                <div className="relative">
                  <p className={`text-muted-foreground leading-relaxed text-lg transition-all duration-300 ${!isAboutExpanded ? 'line-clamp-[10]' : ''}`}>
                    {temple.description}
                  </p>
                  {temple.description && temple.description.length > 500 && (
                    <button 
                      onClick={() => setIsAboutExpanded(!isAboutExpanded)}
                      className="mt-2 text-primary font-semibold text-sm hover:underline"
                    >
                      {isAboutExpanded ? "Read Less" : "Read More..."}
                    </button>
                  )}
                </div>
              </div>

              {/* GALLERY (Mobile Order: 5 | Desktop: Follows About) */}
              <div className="space-y-4 order-5 lg:order-2">
                <h3 className="font-display text-2xl font-semibold">Temple Gallery</h3>
                <div className="h-[350px] sm:h-[450px] flex gap-4">
                  <div className="flex-1 relative rounded-2xl overflow-hidden border-2 border-muted shadow-xl">
                    <img src={galleryImages[currentImageIndex]} className="h-full w-full object-cover transition-all" />
                    {galleryImages.length > 1 && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                        <Button variant="secondary" size="icon" className="rounded-full shadow-xl" onClick={() => setCurrentImageIndex(prev => (prev - 1 + galleryImages.length) % galleryImages.length)}><ChevronUp size={20}/></Button>
                        <Button variant="secondary" size="icon" className="rounded-full shadow-xl" onClick={() => setCurrentImageIndex(prev => (prev + 1) % galleryImages.length)}><ChevronDown size={20}/></Button>
                      </div>
                    )}
                  </div>
                  <div className="hidden sm:flex flex-col gap-3 overflow-y-auto no-scrollbar w-24">
                    {galleryImages.map((img, i) => (
                      <img key={i} src={img} onClick={() => setCurrentImageIndex(i)} className={`h-24 rounded-xl cursor-pointer object-cover border-2 transition-all ${i === currentImageIndex ? 'border-primary' : 'border-transparent opacity-50'}`} />
                    ))}
                  </div>
                </div>
              </div>

              {/* REVIEWS (Mobile Order: 4 | Desktop: Follows Gallery) */}
              <div className="pt-8 border-t space-y-6 order-4 lg:order-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-2xl font-semibold flex items-center gap-2">
                    <MessageSquare className="text-primary" size={24} /> Devotee Experiences
                  </h3>
                  <div className="text-sm font-medium px-3 py-1 bg-primary/10 text-primary rounded-full">{reviews.length} total</div>
                </div>
                {reviewsLoading ? (
                  <div className="grid gap-6 sm:grid-cols-2">{[1, 2].map(i => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}</div>
                ) : reviews.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2">{reviews.map((review: any) => <ExpandableReviewCard key={review.id} review={review} onUpdate={handleReviewDelete} />)}</div>
                ) : (
                  <div className="text-center py-12 bg-muted/30 rounded-2xl border-2 border-dashed border-muted-foreground/20"><p className="text-muted-foreground font-medium">No experiences shared yet.</p></div>
                )}
              </div>
            </div>

            {/* SIDEBAR: Location, Contact, Review Form */}
            <div className="flex flex-col gap-6">
              
              {/* 2. Map and Contact (Mobile Order: 2) */}
              <div className="flex flex-col gap-6 order-2 lg:order-none">
                <div className="rounded-2xl border p-6 bg-card shadow-sm space-y-4">
                  <h3 className="font-semibold text-lg">Location</h3>
                  <div onClick={handleMapRedirect} className="aspect-video rounded-xl relative overflow-hidden cursor-pointer group border shadow-inner bg-slate-100">
                    <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/road-map.png')]" />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/20" />
                    <div className="absolute inset-0 flex items-center justify-center transition-colors group-hover:bg-primary/5">
                        <div className="bg-primary p-3 rounded-full shadow-2xl"><MapPin className="h-6 w-6 text-white" /></div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground flex gap-2 font-medium">
                    <MapPin size={18} className="shrink-0 text-primary mt-0.5"/>
                    {temple.address || `${temple.district}, ${temple.province}`}
                  </p>
                </div>

                <div className="rounded-2xl border p-6 bg-card shadow-sm space-y-5">
                  <h3 className="font-semibold text-lg">Contact Info</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/40 transition-colors">
                      <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary"><Phone size={18}/></div>
                      <div><p className="text-xs text-muted-foreground font-semibold uppercase">Phone</p><p className="font-semibold">{temple.contact || 'N/A'}</p></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Review Form (Mobile Order: 3) */}
              <div className="order-3 lg:order-none">
                <div className="rounded-2xl border bg-primary/5 p-6 border-primary/20 shadow-xl backdrop-blur-sm relative overflow-hidden">
                  <div className="absolute -right-8 -top-8 text-primary/5 rotate-12"><MessageSquare size={100} /></div>
                  <h3 className="mb-4 font-semibold text-lg flex items-center gap-2 text-primary">
                    <Star className="fill-primary" size={20} /> Share Experience
                  </h3>
                  <TempleReviewForm key={formKey} templeId={id || ''} onSuccess={handleReviewSuccess} />
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 6. Products (Mobile Order: Bottom) */}
      <section className="py-20 border-t bg-muted/20">
        <div className="container">
          <div className="mb-10 flex flex-col items-center text-center space-y-4">
             <Badge className="px-4 py-1 text-sm rounded-full">Divine Offerings</Badge>
             <h2 className="font-display text-3xl font-semibold sm:text-4xl">Available Temple Products</h2>
          </div>
          {productsLoading ? (
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-4 lg:grid-cols-6">{[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />)}</div>
          ) : products.length > 0 ? (
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-4 lg:grid-cols-6">{products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}</div>
          ) : (
            <div className="text-center py-16 bg-card rounded-2xl border-2 border-dashed"><Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" /><p className="text-muted-foreground">No products listed.</p></div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TempleDetail;
