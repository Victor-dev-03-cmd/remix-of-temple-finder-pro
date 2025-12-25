import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, MapPin, Sparkles, Building2, LayoutGrid, Map, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import TempleCard from '@/components/temples/TempleCard';
import TempleMap from '@/components/temples/TempleMap';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useTemples, Temple } from '@/hooks/useTemples';
import { sriLankaLocations } from '@/lib/locations';

// Temple types/deities available
const templeTypes = [
  { id: 'all', name: 'All Deities' },
  { id: 'lord-murugan', name: 'Lord Murugan' },
  { id: 'lord-shiva', name: 'Lord Shiva' },
  { id: 'lord-vishnu', name: 'Lord Vishnu' },
  { id: 'lord-ganesha', name: 'Lord Ganesha' },
  { id: 'goddess-durga', name: 'Goddess Durga' },
];

// Services offered by temples
const templeServices = [
  { id: 'pooja', name: 'Pooja Services' },
  { id: 'weddings', name: 'Weddings' },
  { id: 'festivals', name: 'Festivals' },
  { id: 'education', name: 'Religious Education' },
  { id: 'charity', name: 'Charity Programs' },
];

const Temples = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: temples = [], isLoading, error } = useTemples();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedProvince, setSelectedProvince] = useState(searchParams.get('province') || 'all');
  const [selectedDistrict, setSelectedDistrict] = useState(searchParams.get('district') || 'all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Update state when URL params change
  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
    setSelectedProvince(searchParams.get('province') || 'all');
    setSelectedDistrict(searchParams.get('district') || 'all');
  }, [searchParams]);

  const handleTempleClick = (temple: Temple) => {
    navigate(`/temples/${temple.id}`);
  };

  // Get districts based on selected province
  const districts = useMemo(() => {
    if (selectedProvince === 'all') return [];
    return sriLankaLocations.districts[selectedProvince as keyof typeof sriLankaLocations.districts] || [];
  }, [selectedProvince]);

  // Handle province change
  const handleProvinceChange = (value: string) => {
    setSelectedProvince(value);
    setSelectedDistrict('all');
  };

  // Toggle service selection
  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((s) => s !== serviceId)
        : [...prev, serviceId]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedProvince('all');
    setSelectedDistrict('all');
    setSelectedType('all');
    setSelectedServices([]);
  };

  // Filter temples
  const filteredTemples = useMemo(() => {
    return temples.filter((temple) => {
      // Search query filter
      if (
        searchQuery &&
        !temple.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(temple.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Province filter
      if (selectedProvince !== 'all') {
        const provinceName = sriLankaLocations.provinces.find(
          (p) => p.id === selectedProvince
        )?.name;
        if (temple.province !== provinceName) return false;
      }

      // District filter
      if (selectedDistrict !== 'all') {
        const districtName = districts.find((d) => d.id === selectedDistrict)?.name;
        if (temple.district !== districtName) return false;
      }

      // Temple type/deity filter
      if (selectedType !== 'all') {
        const deityName = templeTypes.find((t) => t.id === selectedType)?.name;
        if (deityName && temple.deity !== deityName) return false;
      }

      return true;
    });
  }, [temples, searchQuery, selectedProvince, selectedDistrict, selectedType, districts]);

  const hasActiveFilters =
    searchQuery ||
    selectedProvince !== 'all' ||
    selectedDistrict !== 'all' ||
    selectedType !== 'all' ||
    selectedServices.length > 0;

  return (
    <>
      <Helmet>
        <title>Temples | Temple Connect</title>
        <meta
          name="description"
          content="Explore Hindu temples across Sri Lanka. Find temples by location, deity, and services offered."
        />
      </Helmet>

      <div className="flex min-h-screen flex-col bg-background">
        <Header />

        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-auto max-w-3xl text-center"
              >
                <h1 className="mb-4 font-display text-4xl font-bold text-foreground md:text-5xl">
                  Discover Sacred Temples
                </h1>
                <p className="mb-8 text-lg text-muted-foreground">
                  Explore Hindu temples across Sri Lanka and connect with your spiritual journey
                </p>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search temples by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-14 pl-12 pr-4 text-lg"
                  />
                </div>
              </motion.div>
            </div>
          </section>

          {/* Filters Section */}
          <section className="border-b border-border bg-card py-6">
            <div className="container mx-auto px-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Filter className="h-4 w-4" />
                  Filters:
                </div>

                {/* Location Filter */}
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <Select value={selectedProvince} onValueChange={handleProvinceChange}>
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Province" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Provinces</SelectItem>
                      {sriLankaLocations.provinces.map((province) => (
                        <SelectItem key={province.id} value={province.id}>
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedDistrict}
                    onValueChange={setSelectedDistrict}
                    disabled={selectedProvince === 'all'}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="District" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Districts</SelectItem>
                      {districts.map((district) => (
                        <SelectItem key={district.id} value={district.id}>
                          {district.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Temple Type Filter */}
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Temple Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {templeTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                )}
              </div>

              {/* Services Filter */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  Services:
                </div>
                {templeServices.map((service) => (
                  <Badge
                    key={service.id}
                    variant={selectedServices.includes(service.id) ? 'default' : 'outline'}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleService(service.id)}
                  >
                    {service.name}
                  </Badge>
                ))}
              </div>
            </div>
          </section>

          {/* Results Section */}
          <section className="py-12">
            <div className="container mx-auto px-4">
              {/* View Toggle & Results Count */}
              <div className="mb-6 flex items-center justify-between">
                <p className="text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{filteredTemples.length}</span>{' '}
                  {filteredTemples.length === 1 ? 'temple' : 'temples'}
                </p>
                <ToggleGroup
                  type="single"
                  value={viewMode}
                  onValueChange={(value) => value && setViewMode(value as 'list' | 'map')}
                  className="bg-muted/50 p-1 rounded-lg"
                >
                  <ToggleGroupItem value="list" aria-label="List view" className="gap-2">
                    <LayoutGrid className="h-4 w-4" />
                    <span className="hidden sm:inline">List</span>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="map" aria-label="Map view" className="gap-2">
                    <Map className="h-4 w-4" />
                    <span className="hidden sm:inline">Map</span>
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* View Content */}
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-16 text-center"
                >
                  <Building2 className="mx-auto mb-4 h-16 w-16 text-destructive/50" />
                  <h3 className="mb-2 text-xl font-semibold text-foreground">Error loading temples</h3>
                  <p className="text-muted-foreground">Please try again later</p>
                </motion.div>
              ) : viewMode === 'map' ? (
                <TempleMap temples={filteredTemples} onTempleClick={handleTempleClick} />
              ) : filteredTemples.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredTemples.map((temple, index) => (
                    <TempleCard key={temple.id} temple={temple} index={index} />
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-16 text-center"
                >
                  <Building2 className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
                  <h3 className="mb-2 text-xl font-semibold text-foreground">No temples found</h3>
                  <p className="mb-6 text-muted-foreground">
                    Try adjusting your filters or search query
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </motion.div>
              )}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Temples;
