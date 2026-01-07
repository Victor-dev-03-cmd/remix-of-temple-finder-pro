import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, Search, ShoppingCart, Ticket, Shield, Globe, HeartHandshake } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import TempleSearch from '@/components/temples/TempleSearch';
import TempleCard from '@/components/temples/TempleCard';
import BentoGallery from '@/components/home/BentoGallery';
import { Button } from '@/components/ui/button';
import { useTemples } from '@/hooks/useTemples';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useAuth } from '@/contexts/AuthContext';

const serviceIcons = [Search, ShoppingCart, Ticket, Shield, Globe, HeartHandshake];

const Index = () => {
  const navigate = useNavigate();
  const { data: settings } = useSiteSettings();
  const { data: temples = [], isLoading: templesLoading } = useTemples();
  const { isAdmin, isVendor } = useAuth();
  
  const heroTitle = settings?.heroTitle || 'Discover Sacred Hindu Temples Across Sri Lanka';
  const heroSubtitle = settings?.heroSubtitle || 'Find your spiritual journey by exploring temples, services, and community events';
  const heroCtaText = settings?.heroCtaText || 'Become a Temple Vendor';
  const heroCtaLink = settings?.heroCtaLink || '/become-vendor';
  const defaultCountry = settings?.defaultCountry || 'LK';

  // Services from settings
  const services = [
    { title: settings?.service1Title || 'Search Worldwide Temples', description: settings?.service1Description || 'Explore and discover temple information from around the globe.' },
    { title: settings?.service2Title || 'Temple E-Commerce', description: settings?.service2Description || 'Buy temple products with secure e-commerce support.' },
    { title: settings?.service3Title || 'Booking & Rooms', description: settings?.service3Description || 'Book temple tickets and reserve nearby accommodations.' },
    { title: settings?.service4Title || 'Full Security', description: settings?.service4Description || 'Your data is protected with enterprise-grade security.' },
    { title: settings?.service5Title || 'Global Community', description: settings?.service5Description || 'Connect with devotees and temples worldwide.' },
    { title: settings?.service6Title || 'Dedicated Support', description: settings?.service6Description || '24/7 support to assist you on your spiritual journey.' },
  ];

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

      {/* Hero Section - Gradient Background with Dark Overlay */}
      <section className="relative h-[50vh] sm:h-[60vh] min-h-[350px] sm:min-h-[400px] overflow-hidden bg-gradient-to-br from-primary via-primary/80 to-accent">
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/30" />
        {/* Content */}
        <div className="container relative flex h-full flex-col items-center justify-center text-center px-4">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-3 sm:mb-4 max-w-4xl font-display text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-primary-foreground drop-shadow-lg"
          >
            {heroTitle}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-6 sm:mb-8 max-w-2xl text-sm sm:text-lg text-primary-foreground/90 drop-shadow px-4"
          >
            {heroSubtitle}
          </motion.p>

          {/* Search */}
          <div className="w-full max-w-3xl px-4">
            <TempleSearch countryCode={defaultCountry} onSearch={handleSearch} />
          </div>

          {/* CTA Button - Only show for non-admin and non-vendor users */}
          {!isAdmin && !isVendor && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-4 sm:mt-6"
            >
              <Link to={heroCtaLink}>
                <Button size="lg" variant="secondary" className="gap-2 text-sm sm:text-base">
                  {heroCtaText}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* Services Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-muted/30">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 sm:mb-12 text-center"
          >
            <h2 className="mb-2 sm:mb-3 font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
              Our Services
            </h2>
            <p className="mx-auto max-w-2xl text-sm sm:text-base text-muted-foreground">
              Discover what Temple Connect offers to enhance your spiritual journey.
            </p>
          </motion.div>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => {
              const Icon = serviceIcons[index];
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 font-semibold text-lg text-foreground">{service.title}</h3>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bento Gallery Section */}
      <BentoGallery />

      {/* Featured Temples Section */}
      <section className="py-12 sm:py-16 lg:py-24">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 sm:mb-12 text-center"
          >
            <h2 className="mb-2 sm:mb-3 font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
              Featured Temples
            </h2>
            <p className="mx-auto max-w-2xl text-sm sm:text-base text-muted-foreground">
              Explore some of the most revered and beautiful temples in our network.
            </p>
          </motion.div>

          {templesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
              {temples.slice(0, 4).map((temple, index) => (
                <TempleCard key={temple.id} temple={temple} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section - Only show for non-admin and non-vendor users */}
      {!isAdmin && !isVendor && (
        <section className="bg-muted/50 py-12 sm:py-16 lg:py-20">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="mx-auto max-w-3xl rounded-xl sm:rounded-2xl bg-card p-6 sm:p-8 lg:p-12 text-center shadow-lg"
            >
              <h2 className="mb-3 sm:mb-4 font-display text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                Own a Temple? Become a Temple Connect Vendor!
              </h2>
              <p className="mb-6 sm:mb-8 text-sm sm:text-base text-muted-foreground">
                Showcase your temple to a wider audience, manage services, and connect with devotees.
                Join our growing community.
              </p>
              <Link to="/become-vendor">
                <Button size="lg" className="gap-2 text-sm sm:text-base">
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
