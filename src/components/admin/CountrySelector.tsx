import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

interface CountrySelectorProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

const CountrySelector = ({ value, onChange, className }: CountrySelectorProps) => {
  const [selectedCountry, setSelectedCountry] = useState(value || 'LK');

  useEffect(() => {
    if (value) {
      setSelectedCountry(value);
    }
  }, [value]);

  const handleChange = (newValue: string) => {
    setSelectedCountry(newValue);
    onChange?.(newValue);
  };

  const selectedCountryData = countries.find((c) => c.code === selectedCountry);

  return (
    <Select value={selectedCountry} onValueChange={handleChange}>
      <SelectTrigger className={`w-full sm:w-[180px] ${className}`}>
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
  );
};

export default CountrySelector;
