import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accessory } from '@/lib/data';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';

interface AccessoryCardProps {
  accessory: Accessory;
  index?: number;
}

const AccessoryCard = ({ accessory, index = 0 }: AccessoryCardProps) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart({
      id: accessory.id,
      name: accessory.name,
      price: accessory.price,
      image_url: accessory.image,
      vendor_id: accessory.templeId, // Using templeId as vendor for demo
    });
    toast({
      title: 'Added to Cart',
      description: `${accessory.name} has been added to your cart.`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -3 }}
      className="group overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={accessory.image}
          alt={accessory.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Content */}
      <div className="p-3">
        <h4 className="mb-1 text-sm font-medium text-foreground line-clamp-2">
          {accessory.name}
        </h4>
        <p className="mb-3 text-lg font-semibold text-primary">
          LKR {accessory.price.toLocaleString()}
        </p>
        <Button
          onClick={handleAddToCart}
          size="sm"
          className="w-full gap-2"
        >
          <ShoppingCart className="h-4 w-4" />
          Add to Cart
        </Button>
      </div>
    </motion.div>
  );
};

export default AccessoryCard;
