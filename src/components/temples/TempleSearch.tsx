import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { sriLankaLocations } from '@/lib/locations';

interface TempleSearchProps {
  onSearch?: (filters: { query: string; province: string; district: string }) => void;
}

const TempleSearch = ({ onSearch }: TempleSearchProps) => {
  const [query, setQuery] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');

  const districts = province
    ? sriLankaLocations.districts[province as keyof typeof sriLankaLocations.districts] || []
    : [];

  const handleProvinceChange = (value: string) => {
    setProvince(value);
    setDistrict('');
  };

  const handleSearch = () => {
    onSearch?.({ query, province, district });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="w-full max-w-4xl"
    >
      <div className="flex flex-col gap-3 rounded-xl bg-card/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center">
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

        {/* Province Select */}
        <Select value={province} onValueChange={handleProvinceChange}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Province" />
          </SelectTrigger>
          <SelectContent>
            {sriLankaLocations.provinces.map((p) => (
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
          <SelectContent>
            {districts.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search Button */}
        <Button onClick={handleSearch} className="w-full sm:w-auto">
          Search Temples
        </Button>
      </div>
    </motion.div>
  );
};

export default TempleSearch;
