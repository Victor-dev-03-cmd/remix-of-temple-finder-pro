import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPin, Phone, Star, ArrowLeft, Package, Clock, Loader2, 
  ExternalLink, ChevronUp, ChevronDown, MessageSquare, Eye, EyeOff 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/products/ProductCard';
import TempleReviewForm from '@/components/temples/TempleReviewForm';
import TempleReviewCard from '@/components/temples/TempleReviewCard';
import TempleBookingForm from '@/components/temples/TempleBookingForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useTemple } from '@/hooks/useTemples';
import { useTempleProducts } from '@/hooks/useTempleProducts';
import { useTempleReviews } from '@/hooks/useTempleReviews';

// Simplified Expandable Review Card
const ExpandableReviewCard = ({ review }: { review: any }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const textLimit = 130; 
  const shouldTruncate = review.comment?.length > textLimit;

  // Get User Name from account or review data
  const displayName = review.profiles?.full_name || review.user_name || 'Devotee';

  return (
    <div className="flex flex-col rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
            {displayName.charAt(0)}
          </div>
          <div>
            <h4 className="font-semibold text-sm">{displayName}</h4>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={12} className={i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-muted"} />
              ))}
            </div>
          </div>
        </div>
        {shouldTruncate && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            {isExpanded ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px]' : 'max-h-[65px]'}`}>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {review.comment}
        </p>
      </div>
      
      {!isExpanded && shouldTruncate && (
        <span className="text-muted-foreground/50 text-xs mt-[-5px]">...</span>
      )}

      <div className="mt-4 text-[10px] text-muted-foreground uppercase tracking-wider">
        {new Date(review.created_at).toLocaleDateString()}
      </div>
    </div>
  );
};

const TempleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: temple, isLoading, error } = useTemple(id || '');
  const { data: reviews = [], isLoading: reviewsLoading, refetch: refetchReviews } = useTempleReviews(id || '');
  const { products, loading: productsLoading } = useTempleProducts(id);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [formKey, setFormKey] = useState(0); // For resetting form

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!temple || error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-foreground">Temple Not Found</h1>
          <Link to="/temples"><Button>Browse Temples</Button></Link>
        </div>
      </div>
    );
  }

  const handleReviewSuccess = () => {
    refetchReviews();
    setFormKey(prev => prev + 1); // This resets the form component
  };

  const handleMapRedirect = () => {
    const url = temple.latitude && temple.longitude 
      ? `https://www.google.com/maps?q=${temple.latitude},${temple.longitude}`
      : `https://www.google.com/maps/search/${encodeURIComponent(temple.name + ' ' + temple.district)}`;
    window.open(url, '_blank');
  };

  const galleryImages = temple.gallery_images || [temple.image];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative h-[45vh] min-h-[350px] overflow-hidden">
        <div className="absolute inset-0">
          <img src={temple.image} alt={temple.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/95 via-foreground/40 to-transparent" />
        </div>
        <div className="container relative flex h-full flex-col justify-end pb-8">
          <Link to="/temples" className="mb-4 inline-flex w-fit">
            <Button variant="ghost" size="sm" className="gap-2 text-primary-foreground/80 hover:text-primary-foreground bg-white/10 backdrop-blur-sm">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="mb-2 font-display text-3xl font-bold text-primary-foreground sm:text-5xl">{temple.name}</h1>
              <div className="flex items-center gap-2 text-primary-foreground/90"><MapPin className="h-4 w-4" /> <span>{temple.district}, {temple.province}</span></div>
            </div>
            <TempleBookingForm templeId={temple.id} templeName={temple.name} />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-10">
              <div>
                <h2 className="mb-4 font-display text-2xl font-semibold border-b pb-2">About the Temple</h2>
                <p className="text-muted-foreground leading-relaxed">{temple.description || 'Sacred temple description...'}</p>

                {/* Vertical Gallery */}
                <div className="mt-10 h-[400px] flex gap-4">
                  <div className="flex-1 relative rounded-xl overflow-hidden border bg-muted">
                    <img src={galleryImages[currentImageIndex]} className="h-full w-full object-cover" />
                    {galleryImages.length > 1 && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                        <Button variant="secondary" size="icon" className="rounded-full shadow-lg" onClick={() => setCurrentImageIndex(prev => (prev - 1 + galleryImages.length) % galleryImages.length)}><ChevronUp size={18}/></Button>
                        <Button variant="secondary" size="icon" className="rounded-full shadow-lg" onClick={() => setCurrentImageIndex(prev => (prev + 1) % galleryImages.length)}><ChevronDown size={18}/></Button>
                      </div>
                    )}
                  </div>
                  <div className="hidden sm:flex flex-col gap-2 overflow-y-auto no-scrollbar w-20">
                    {galleryImages.map((img, i) => (
                      <img key={i} src={img} onClick={() => setCurrentImageIndex(i)} className={`h-20 rounded-md cursor-pointer object-cover border-2 ${i === currentImageIndex ? 'border-primary' : 'border-transparent opacity-60'}`} />
                    ))}
                  </div>
                </div>
              </div>

              {temple.services && (
                <div>
                  <h3 className="mb-3 font-semibold">Services Offered</h3>
                  <div className="flex flex-wrap gap-2">{temple.services.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}</div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="rounded-xl border p-5 space-y-4">
                <h3 className="font-semibold">Location</h3>
                <div onClick={handleMapRedirect} className="aspect-video rounded-lg bg-muted flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-all border relative overflow-hidden">
                   <MapPin className="h-8 w-8 text-primary z-10" />
                   <div className="absolute inset-0 bg-primary/5" />
                </div>
                {temple.address && <p className="text-sm text-muted-foreground flex gap-2"><MapPin size={16} className="shrink-0"/>{temple.address}</p>}
              </div>

              <div className="rounded-xl border p-5">
                <h3 className="mb-4 font-semibold">Contact & Hours</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  {temple.contact && <p className="flex items-center gap-2"><Phone size={14}/>{temple.contact}</p>}
                  {temple.opening_hours && <p className="flex items-center gap-2"><Clock size={14}/>{temple.opening_hours}</p>}
                </div>
              </div>

              {/* Review Form with Reset logic */}
              <div className="rounded-xl border bg-primary/5 p-5 border-primary/20 shadow-inner">
                <h3 className="mb-4 font-semibold flex items-center gap-2"><MessageSquare size={16} /> Write a Review</h3>
                <TempleReviewForm key={formKey} templeId={id || ''} onSuccess={handleReviewSuccess} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="py-12 bg-muted/20 border-t">
        <div className="container">
          <h2 className="mb-8 font-display text-2xl font-semibold">Devotee Reviews</h2>
          {reviewsLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
            </div>
          ) : reviews.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((review: any) => <ExpandableReviewCard key={review.id} review={review} />)}
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-xl"><p className="text-muted-foreground">No reviews yet.</p></div>
          )}
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 border-t">
        <div className="container">
          <h2 className="mb-8 font-display text-2xl font-semibold">Temple Products</h2>
          {productsLoading ? (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-6">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
            </div>
          ) : products.length > 0 ? (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-6">
              {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground border rounded-xl">No products available.</div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TempleDetail;