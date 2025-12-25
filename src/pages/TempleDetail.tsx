import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Phone, Star, ArrowLeft, Package, Clock, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/products/ProductCard';
import TempleReviewForm from '@/components/temples/TempleReviewForm';
import TempleReviewCard from '@/components/temples/TempleReviewCard';
import TempleBookingForm from '@/components/temples/TempleBookingForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useTemple } from '@/hooks/useTemples';
import { useProducts } from '@/hooks/useProducts';
import { useTempleReviews } from '@/hooks/useTempleReviews';

const TempleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: temple, isLoading, error } = useTemple(id || '');
  const { data: reviews = [], isLoading: reviewsLoading } = useTempleReviews(id || '');
  const { products, loading: productsLoading } = useProducts({ limit: 6 });

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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[350px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={temple.image}
            alt={temple.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/95 via-foreground/40 to-transparent" />
        </div>

        <div className="container relative flex h-full flex-col justify-end pb-8">
          <Link to="/temples" className="mb-4 inline-flex w-fit">
            <Button variant="ghost" size="sm" className="gap-2 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/20">
              <ArrowLeft className="h-4 w-4" />
              Back to Temples
            </Button>
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <h1 className="mb-2 font-display text-3xl font-bold text-primary-foreground sm:text-4xl lg:text-5xl">
                {temple.name}
              </h1>
              <div className="flex items-center gap-2 text-primary-foreground/90">
                <MapPin className="h-4 w-4" />
                <span>{temple.district}, {temple.province}</span>
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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="mb-4 font-display text-2xl font-semibold text-foreground">
                  About the Temple
                </h2>
                <p className="mb-4 text-muted-foreground leading-relaxed">
                  {temple.description || 'No description available.'}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  The temple is dedicated to {temple.deity} and serves as a spiritual beacon for thousands of devotees.
                </p>

                {/* Services */}
                {temple.services && temple.services.length > 0 && (
                  <div className="mt-6">
                    <h3 className="mb-3 font-semibold text-foreground">Services Offered</h3>
                    <div className="flex flex-wrap gap-2">
                      {temple.services.map((service) => (
                        <Badge key={service} variant="secondary">{service}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {/* Location Card */}
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="mb-4 font-semibold text-foreground">Location</h3>
                <div className="mb-4 aspect-video overflow-hidden rounded-lg bg-muted relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
                  <div className="text-center z-10">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium text-foreground">{temple.district}</p>
                    <p className="text-xs text-muted-foreground">{temple.province}</p>
                  </div>
                </div>
                {temple.address && (
                  <p className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    {temple.address}
                  </p>
                )}
              </div>

              {/* Contact & Hours Card */}
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="mb-4 font-semibold text-foreground">Contact & Hours</h3>
                <div className="space-y-3">
                  {temple.contact && (
                    <a
                      href={`tel:${temple.contact}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                    >
                      <Phone className="h-4 w-4" />
                      {temple.contact}
                    </a>
                  )}
                  {temple.opening_hours && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{temple.opening_hours}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Products Section - From Database */}
      <section className="border-t border-border bg-muted/30 py-12">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-6 font-display text-2xl font-semibold text-foreground">
              Featured Products
            </h2>
            {productsLoading ? (
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                {products.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-lg font-medium text-foreground">No products available yet</p>
                <p className="text-sm text-muted-foreground">
                  Check back soon for temple accessories and offerings
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </section>


      {/* Reviews Section */}
      <section className="py-12">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-6 font-display text-2xl font-semibold text-foreground">
              Devotee Reviews
            </h2>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="all">All Reviews ({reviews.length})</TabsTrigger>
                <TabsTrigger value="write">Write a Review</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <div className="mb-6 flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.round(temple.rating || 0)
                            ? 'fill-temple-gold text-temple-gold'
                            : 'fill-muted text-muted'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-medium text-foreground">
                    {temple.rating ? Number(temple.rating).toFixed(1) : '0.0'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({temple.reviewCount} {temple.reviewCount === 1 ? 'review' : 'reviews'})
                  </span>
                </div>

                {reviewsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-32 w-full rounded-lg" />
                    ))}
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {reviews.map((review, index) => (
                      <TempleReviewCard key={review.id} review={review} index={index} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
                    <Star className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-lg font-medium text-foreground">No reviews yet</p>
                    <p className="text-sm text-muted-foreground">
                      Be the first to share your experience
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="write">
                <TempleReviewForm templeId={id || ''} />
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </section>


      <Footer />
    </div>
  );
};

export default TempleDetail;
