import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Temple } from '@/hooks/useTemples';

interface TempleCardProps {
  temple: Temple;
  index?: number;
}

const TempleCard = ({ temple, index = 0 }: TempleCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -5 }}
      className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={temple.image}
          alt={temple.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="mb-1 font-display text-lg font-semibold text-foreground line-clamp-1">
          {temple.name}
        </h3>
        <p className="mb-2 text-sm text-muted-foreground">
          {temple.district}, {temple.province}
        </p>
        <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
          {temple.description}
        </p>

        {/* Rating */}
        <div className="mb-4 flex items-center gap-1">
          <Star className="h-4 w-4 fill-temple-gold text-temple-gold" />
          <span className="text-sm font-medium text-foreground">{temple.rating}</span>
          <span className="text-sm text-muted-foreground">({temple.reviewCount} reviews)</span>
        </div>

        {/* Action */}
        <Link to={`/temple/${temple.id}`}>
          <Button variant="outline" className="w-full">
            View Details
          </Button>
        </Link>
      </div>
    </motion.div>
  );
};

export default TempleCard;
