import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPin, Phone, Star, ArrowLeft, Package, Clock, Loader2, 
  ExternalLink, ChevronUp, ChevronDown, MessageSquare 
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

const TempleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: temple, isLoading, error } = useTemple(id || '');
  const { data: reviews = [], isLoading: reviewsLoading } = useTempleReviews(id || '');
  const { products, loading: productsLoading } = useTempleProducts(id);

  // Vertical Gallery State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!temple || error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-foreground">Temple Not Found</h1>
          <Link to="/temples">
            <Button>Browse Temples</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleMapRedirect = () => {
    if (temple.latitude && temple.longitude) {
      window.open(`https://www.google.com/maps?q=${temple.latitude},${temple.longitude}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps?q=${encodeURIComponent(temple.name + ' ' + temple.district)}`, '_blank');
    }
  };

  const galleryImages = temple.gallery_images || [temple.image];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[350px] overflow-hidden">
        <div className="absolute inset-0">
          <img src={temple.image} alt={temple.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/95 via-foreground/40 to-transparent" />
        </div>

        <div className="container relative flex h-full flex-col justify-end pb-8">
          <Link to="/temples" className="mb-4 inline-flex w-fit">
            <Button variant="ghost" size="sm" className="gap-2 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/20">
              <ArrowLeft className="h-4 w-4" /> Back to Temples
            </Button>
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="mb-2 font-display text-3xl font-bold text-primary-foreground sm:text-4xl lg:text-5xl">{temple.name}</h1>
              <div className="flex items-center gap-2 text-primary-foreground/90">
                <MapPin className="h-4 w-4" /> <span>{temple.district}, {temple.province}</span>
              </div>
            </div>
            <TempleBookingForm templeId={temple.id} templeName={temple.name} />
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h2 className="mb-4 font-display text-2xl font-semibold text-foreground">About the Temple</h2>
                <p className="mb-4 text-muted-foreground leading-relaxed">{temple.description || 'No description available.'}</p>
                <p className="text-muted-foreground leading-relaxed">The temple is dedicated to {temple.deity}.</p>

                {/* --- VERTICAL IMAGE CAROUSEL GALLERY --- */}
                <div className="mt-10">
                  <h3 className="mb-4 font-semibold text-foreground">Temple Gallery</h3>
                  <div className="relative flex gap-4 h-[400px]">
                     {/* Large Vertical View */}
                     <div className="relative flex-1 overflow-hidden rounded-xl bg-muted border">
                        <motion.img
                          key={currentImageIndex}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          src={galleryImages[currentImageIndex]}
                          className="h-full w-full object-cover"
                        />
                        {galleryImages.length > 1 && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                            <Button variant="secondary" size="icon" className="rounded-full shadow-md" onClick={prevImage}><ChevronUp/></Button>
                            <Button variant="secondary" size="icon" className="rounded-full shadow-md" onClick={nextImage}><ChevronDown/></Button>
                          </div>
                        )}
                     </div>
                     {/* Thumbnails (Sidebar of gallery) */}
                     <div className="hidden sm:flex flex-col gap-2 overflow-y-auto no-scrollbar w-20">
                        {galleryImages.map((img, i) => (
                          <img 
                            key={i} 
                            src={img} 
                            onClick={() => setCurrentImageIndex(i)}
                            className={`h-20 w-full object-cover rounded-md cursor-pointer border-2 transition-all ${i === currentImageIndex ? 'border-primary' : 'border-transparent opacity-60'}`} 
                          />
                        ))}
                     </div>
                  </div>
                </div>

                {/* Services */}
                {temple.services && temple.services.length > 0 && (
                  <div className="mt-10">
                    <h3 className="mb-3 font-semibold text-foreground">Services Offered</h3>
                    <div className="flex flex-wrap gap-2">
                      {temple.services.map((service) => <Badge key={service} variant="secondary">{service}</Badge>)}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Sidebar (Location & Contact - NO CHANGES HERE) */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="mb-4 font-semibold text-foreground">Location</h3>
                <div onClick={handleMapRedirect} className="mb-4 aspect-video overflow-hidden rounded-lg bg-muted relative flex items-center justify-center cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
                  <div className="text-center z-10">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">View on Google Maps</p>
                  </div>
                </div>
                {temple.address && <p className="flex items-start gap-2 text-sm text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{temple.address}</p>}
              </div>

              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="mb-4 font-semibold text-foreground">Contact & Hours</h3>
                <div className="space-y-3">
                  {temple.contact && <a href={`tel:${temple.contact}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><Phone className="h-4 w-4" />{temple.contact}</a>}
                  {temple.opening_hours && <div className="flex items-start gap-2 text-sm text-muted-foreground"><Clock className="mt-0.5 h-4 w-4 shrink-0" /><span>{temple.opening_hours}</span></div>}
                </div>
              </div>

              {/* REVIEW FORM - ALWAYS OPEN IN SIDEBAR */}
              <div className="rounded-lg border bg-primary/5 p-5 border-primary/20">
                <h3 className="mb-4 font-semibold text-foreground flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Write a Review
                </h3>
                <TempleReviewForm templeId={id || ''} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* REVIEWS GRID SECTION */}
      <section className="py-12 bg-muted/30">
        <div className="container">
          <h2 className="mb-8 font-display text-2xl font-semibold text-foreground">Devotee Reviews</h2>
          {reviewsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
            </div>
          ) : reviews.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((review, index) => <TempleReviewCard key={review.id} review={review} index={index} />)}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed rounded-lg bg-background">
              <p className="text-muted-foreground">No reviews yet. Share your first experience!</p>
            </div>
          )}
        </div>
      </section>

      {/* PRODUCTS SECTION - BOTTOM GRID */}
      <section className="py-12 border-t">
        <div className="container">
          <div className="mb-8">
            <h2 className="font-display text-2xl font-semibold text-foreground">Temple Products</h2>
            <p className="text-sm text-muted-foreground">Offerings and spiritual items from this temple</p>
          </div>
          
          {productsLoading ? (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square w-full rounded-lg" />)}
            </div>
          ) : products.length > 0 ? (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-6">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-12 text-center bg-card">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground font-medium">No products available currently</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TempleDetail;