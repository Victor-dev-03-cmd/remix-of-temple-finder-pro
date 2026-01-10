import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Loader2, 
  Search, 
  ShoppingCart, 
  Ticket, 
  Shield, 
  Globe, 
  HeartHandshake 
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import TempleSearch from '@/components/temples/TempleSearch';
import TempleCard from '@/components/temples/TempleCard';
import BentoGallery from '@/components/home/BentoGallery';
import { Button } from '@/components/ui/button';
import { useTemples } from '@/hooks/useTemples';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const serviceIcons = [Search, ShoppingCart, Ticket, Shield, Globe, HeartHandshake];

const Index = () => {
  const navigate = useNavigate();
  const { data: settings } = useSiteSettings();
  const { data: temples = [], isLoading: templesLoading } = useTemples();
  const { isAdmin, isVendor } = useAuth();
  
  // மாற்றம்: ஆரம்பத்தில் null மற்றும் Loading state
  const [activeLayout, setActiveLayout] = useState<string | null>(null);
  const [isLayoutLoading, setIsLayoutLoading] = useState(true);

  useEffect(() => {
    const fetchLayout = async () => {
      setIsLayoutLoading(true); // லோடிங் தொடக்கம்
      try {
        const { data } = await (supabase.from('site_layouts' as any)
          .select('active_layout')
          .eq('section_name', 'hero')
          .maybeSingle() as any);
        
        if (data) {
          setActiveLayout(data.active_layout);
        } else {
          setActiveLayout('style_1'); // தரவு இல்லை என்றால் மட்டும் default
        }
      } catch (err) {
        setActiveLayout('style_1');
      } finally {
        setIsLayoutLoading(false); // லோடிங் முடிவு
      }
    };
    fetchLayout();

    const channel = supabase.channel('hero-layout-sync')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'site_layouts', 
        filter: 'section_name=eq.hero' 
      }, (payload) => {
        setActiveLayout(payload.new.active_layout);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const heroTitle = settings?.heroTitle || 'Discover Sacred Hindu Temples Across Sri Lanka';
  const heroSubtitle = settings?.heroSubtitle || 'Find your spiritual journey by exploring temples, services, and community events';
  const heroCtaText = settings?.heroCtaText || 'Become a Temple Vendor';
  const heroCtaLink = settings?.heroCtaLink || '/become-vendor';
  const defaultCountry = settings?.defaultCountry || 'LK';

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

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[600px] sm:min-h-[700px] overflow-hidden bg-[#0A192F] flex items-center py-12">
        
        {/* லோடிங் ஆகும் போது வெறும் Background மட்டும் காட்டி Flicker-ஐ தவிர்க்கிறோம் */}
        {isLayoutLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
          </div>
        ) : (
          <>
            <motion.div
              className="absolute w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full blur-[80px] sm:blur-[120px] opacity-40 pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(255,191,0,1) 0%, rgba(255,154,0,0) 70%)" }}
              animate={{ x: [-100, 200, 0, -150], y: [-50, 100, 200, -50], scale: [1, 1.1, 0.9, 1] }}
              transition={{ duration: 15, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-transparent to-accent/20" />
            <div className="absolute inset-0 bg-black/20" />

            <div className={`container relative z-10 px-4 flex flex-col gap-12 transition-all duration-500 ${
              activeLayout === 'style_1' ? 'lg:flex-row text-left items-center' : 
              activeLayout === 'style_2' ? 'lg:flex-row-reverse text-left items-center' : 
              'items-center text-center'
            }`}>
              
              <div className={`flex-1 ${activeLayout === 'style_3' ? 'max-w-4xl' : 'w-full'}`}>
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                  className="mb-4 font-display text-3xl sm:text-5xl lg:text-6xl font-bold text-white drop-shadow-xl"
                >
                  {heroTitle}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className={`mb-8 text-sm sm:text-lg text-white/90 font-medium ${activeLayout === 'style_3' ? 'mx-auto' : ''} max-w-2xl`}
                >
                  {heroSubtitle}
                </motion.p>

                {activeLayout !== 'style_3' && !isAdmin && !isVendor && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                    <Link to={heroCtaLink}>
                      <Button size="lg" variant="secondary" className="gap-2 font-semibold shadow-lg">
                        {heroCtaText} <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </motion.div>
                )}
              </div>

              {/* Line by Line மாற்றம்: lg:max-w-md என்பது கார்டை வரிசையாக அடுக்க உதவும் */}
              <div className={`w-full ${activeLayout === 'style_3' ? 'max-w-3xl' : 'lg:max-w-md'}`}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <TempleSearch countryCode={defaultCountry} onSearch={handleSearch} />
                </motion.div>

                {activeLayout === 'style_3' && !isAdmin && !isVendor && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8">
                    <Link to={heroCtaLink}>
                      <Button size="lg" variant="secondary" className="gap-2 font-semibold shadow-lg">
                        {heroCtaText} <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </motion.div>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      {/* --- SERVICES SECTION --- */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 font-display text-3xl lg:text-4xl font-bold text-foreground">Our Services</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">Discover what Temple Connect offers to enhance your spiritual journey.</p>
          </div>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => {
              const Icon = serviceIcons[index];
              return (
                <div key={index} className="group rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 font-semibold text-lg">{service.title}</h3>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <BentoGallery />

      <section className="py-16 lg:py-24">
        <div className="container px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold">Featured Temples</h2>
            <p className="text-muted-foreground mt-2">Explore the most revered temples in our network.</p>
          </div>
          {templesLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {temples.slice(0, 4).map((temple, index) => (
                <TempleCard key={temple.id} temple={temple} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;