import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import TempleSearch from '@/components/temples/TempleSearch';
import TempleCard from '@/components/temples/TempleCard';
import BentoGallery from '@/components/home/BentoGallery';
import { Button } from '@/components/ui/button';
import { useTemples } from '@/hooks/useTemples';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useAuth } from '@/contexts/AuthContext';
import heroImage from '@/assets/hero-temple.jpg';

const Index = () => {
  const navigate = useNavigate();
  const { data: settings } = useSiteSettings();
  const { data: temples = [], isLoading: templesLoading } = useTemples();
  const { isAdmin, isVendor } = useAuth();
  
  const heroTitle = settings?.heroTitle || 'Discover Sacred Hindu Temples Across Sri Lanka';
  const heroSubtitle = settings?.heroSubtitle || 'Find your spiritual journey by exploring temples, services, and community events';
  const heroCtaText = settings?.heroCtaText || 'Become a Temple Vendor';
  const heroCtaLink = settings?.heroCtaLink || '/become-vendor';
  const heroImageUrl = settings?.heroImageUrl || heroImage;
  const defaultCountry = settings?.defaultCountry || 'LK';

  const handleSearch = (filters: { query: string; province: string; district: string; country: string }) => {
    const params = new URLSearchParams();
    if (filters.query) params.set('q', filters.query);
    if (filters.province) params.set('province', filters.province);
    if (filters.district) params.set('district', filters.district);
    if (filters.country) params.set('country', filters.country);
    navigate(`/temples?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative h-[85vh] min-h-[600px] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={heroImageUrl}
            alt="Hindu Temple"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-hero" />
        </div>

        {/* Content */}
        <div className="container relative flex h-full flex-col items-center justify-center text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-4 max-w-4xl font-display text-4xl font-bold text-primary-foreground drop-shadow-lg sm:text-5xl lg:text-6xl"
          >
            {heroTitle}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-8 max-w-2xl text-lg text-primary-foreground/90 drop-shadow"
          >
            {heroSubtitle}
          </motion.p>

          {/* Search */}
          <TempleSearch countryCode={defaultCountry} onSearch={handleSearch} />

          {/* CTA Button - Only show for non-admin and non-vendor users */}
          {!isAdmin && !isVendor && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6"
            >
              <Link to={heroCtaLink}>
                <Button size="lg" className="gap-2">
                  {heroCtaText}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* Bento Gallery Section */}
      <BentoGallery />

      {/* Featured Temples Section */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Featured Temples
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Explore some of the most revered and beautiful temples in our network.
            </p>
          </motion.div>

          {templesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {temples.slice(0, 4).map((temple, index) => (
                <TempleCard key={temple.id} temple={temple} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section - Only show for non-admin and non-vendor users */}
      {!isAdmin && !isVendor && (
        <section className="bg-muted/50 py-16 lg:py-20">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="mx-auto max-w-3xl rounded-2xl bg-card p-8 text-center shadow-lg lg:p-12"
            >
              <h2 className="mb-4 font-display text-2xl font-bold text-foreground sm:text-3xl">
                Own a Temple? Become a Temple Connect Vendor!
              </h2>
              <p className="mb-8 text-muted-foreground">
                Showcase your temple to a wider audience, manage services, and connect with devotees.
                Join our growing community.
              </p>
              <Link to="/become-vendor">
                <Button size="lg" className="gap-2">
                  Register Your Temple Today
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default Index;
