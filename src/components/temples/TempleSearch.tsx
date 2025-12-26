import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getLocationsForCountry } from '@/lib/locations';

const countries = [
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
];

interface TempleSearchProps {
  onSearch?: (filters: { query: string; province: string; district: string; country: string }) => void;
  countryCode?: string;
}

const TempleSearch = ({ onSearch, countryCode = 'LK' }: TempleSearchProps) => {
  const [query, setQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(countryCode);
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');

  // Update selected country when prop changes
  useEffect(() => {
    setSelectedCountry(countryCode);
    setProvince('');
    setDistrict('');
  }, [countryCode]);

  // Get locations based on the selected country
  const locations = getLocationsForCountry(selectedCountry);
  const provinces = locations.provinces || [];
  const districts = province
    ? locations.districts[province as keyof typeof locations.districts] || []
    : [];

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    setProvince('');
    setDistrict('');
  };

  const handleProvinceChange = (value: string) => {
    setProvince(value);
    setDistrict('');
  };

  const handleSearch = () => {
    onSearch?.({ query, province, district, country: selectedCountry });
  };

  const selectedCountryData = countries.find((c) => c.code === selectedCountry);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="w-full max-w-5xl"
    >
      <div className="flex flex-col gap-3 rounded-xl bg-card/95 p-4 shadow-lg backdrop-blur">
        {/* First Row: Country + Search Input */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Country Select */}
          <Select value={selectedCountry} onValueChange={handleCountryChange}>
            <SelectTrigger className="w-full sm:w-44">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <SelectValue>
                  {selectedCountryData && (
                    <span className="flex items-center gap-2">
                      <span>{selectedCountryData.flag}</span>
                      <span className="hidden sm:inline">{selectedCountryData.name}</span>
                      <span className="sm:hidden">{selectedCountryData.code}</span>
                    </span>
                  )}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent className="max-h-[300px] bg-background z-50">
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  <span className="flex items-center gap-2">
                    <span>{country.flag}</span>
                    <span>{country.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by temple name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Second Row: Province, District, Search Button */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Province Select */}
          <Select value={province} onValueChange={handleProvinceChange}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Province/State" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] bg-background z-50">
              {provinces.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* District Select */}
          <Select value={district} onValueChange={setDistrict} disabled={!province}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="District" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] bg-background z-50">
              {districts.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Search Button */}
          <Button onClick={handleSearch} className="w-full sm:flex-1">
            Search Temples
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default TempleSearch;
