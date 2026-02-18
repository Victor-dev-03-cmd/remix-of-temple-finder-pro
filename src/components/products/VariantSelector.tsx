import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Check, Tag, Weight, Ruler } from 'lucide-react';
import { ProductVariant } from '@/hooks/useProductVariants';

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedSize: ProductVariant | null;
  selectedColor: ProductVariant | null;
  selectedWeight: ProductVariant | null;
  onSelectSize: (variant: ProductVariant) => void;
  onSelectColor: (variant: ProductVariant) => void;
  onSelectWeight: (variant: ProductVariant) => void;
}

const predefinedColors = [
  { name: 'Red', color: 'bg-red-500', hex: '#ef4444' },
  { name: 'Blue', color: 'bg-blue-500', hex: '#3b82f6' },
  { name: 'Green', color: 'bg-green-500', hex: '#22c55e' },
  { name: 'Yellow', color: 'bg-yellow-500', hex: '#eab308' },
  { name: 'Orange', color: 'bg-orange-500', hex: '#f97316' },
  { name: 'Purple', color: 'bg-purple-500', hex: '#a855f7' },
  { name: 'Pink', color: 'bg-pink-500', hex: '#ec4899' },
  { name: 'Indigo', color: 'bg-indigo-500', hex: '#6366f1' },
  { name: 'Teal', color: 'bg-teal-500', hex: '#14b8a6' },
  { name: 'Cyan', color: 'bg-cyan-500', hex: '#06b6d4' },
  { name: 'Black', color: 'bg-black', hex: '#000000' },
  { name: 'White', color: 'bg-white border border-border', hex: '#ffffff' },
  { name: 'Gray', color: 'bg-gray-500', hex: '#6b7280' },
  { name: 'Gold', color: 'bg-amber-400', hex: '#fbbf24' },
  { name: 'Silver', color: 'bg-gray-300', hex: '#d1d5db' },
  { name: 'Bronze', color: 'bg-amber-700', hex: '#b45309' },
  { name: 'Rose Gold', color: 'bg-rose-300', hex: '#fda4af' },
  { name: 'Navy', color: 'bg-blue-900', hex: '#1e3a8a' },
  { name: 'Maroon', color: 'bg-red-900', hex: '#7f1d1d' },
  { name: 'Olive', color: 'bg-lime-700', hex: '#4d7c0f' },
  { name: 'Beige', color: 'bg-amber-100', hex: '#fef3c7' },
  { name: 'Cream', color: 'bg-orange-50', hex: '#fff7ed' },
  { name: 'Brown', color: 'bg-amber-800', hex: '#92400e' },
  { name: 'Charcoal', color: 'bg-gray-800', hex: '#1f2937' },
];

const weightUnits = ['g', 'kg', 'ml', 'l', 'oz', 'lb'];

export const VariantSelector = ({
  variants,
  selectedSize,
  selectedColor,
  selectedWeight,
  onSelectSize,
  onSelectColor,
  onSelectWeight,
}: VariantSelectorProps) => {
  // Group variants by type (Color, Weight, Size/Other)
  const { colorVariants, weightVariants, sizeVariants } = useMemo(() => {
    const colors: ProductVariant[] = [];
    const weights: ProductVariant[] = [];
    const sizes: ProductVariant[] = [];

    variants.forEach((v) => {
      const nameLower = v.name.toLowerCase();
      
      // Check for Color
      const isColor = predefinedColors.some(
        (c) => c.name.toLowerCase() === nameLower
      );

      if (isColor) {
        colors.push(v);
        return;
      }

      // Check for Weight/Quantity
      const isWeight = weightUnits.some(unit => {
         const regex = new RegExp(`\\d+\\s*${unit}$`, 'i');
         return regex.test(v.name);
      });

      if (isWeight) {
        weights.push(v);
        return;
      }

      // Default to Size/Other
      sizes.push(v);
    });

    return { colorVariants: colors, weightVariants: weights, sizeVariants: sizes };
  }, [variants]);

  // Determine if stock is tracked for each group
  // If ANY variant in the group has stock > 0, we assume the group is tracked.
  // If ALL variants in the group have stock 0, we assume it's just an option list (not tracked).
  const isSizeStockTracked = useMemo(() => sizeVariants.some(v => v.stock > 0), [sizeVariants]);
  const isWeightStockTracked = useMemo(() => weightVariants.some(v => v.stock > 0), [weightVariants]);
  const isColorStockTracked = useMemo(() => colorVariants.some(v => v.stock > 0), [colorVariants]);

  if (variants.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Size / Other Variants Selection */}
      {sizeVariants.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <Ruler className="h-4 w-4" /> Select Size
          </h3>
          <div className="grid grid-cols-3 gap-2 max-w-md">
            {sizeVariants.map((variant) => {
              const isDisabled = isSizeStockTracked && variant.stock === 0;
              return (
                <button
                  key={variant.id}
                  onClick={() => onSelectSize(variant)}
                  className={`relative flex flex-col items-center justify-center rounded-lg border-2 px-2 py-2 transition-all text-center ${
                    selectedSize?.id === variant.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border'
                  } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isDisabled}
                >
                  <p className="font-bold text-xs line-clamp-1">{variant.name}</p>
                  {variant.price > 0 && (
                    <p className="text-[10px] font-black text-primary mt-1">
                      LKR {variant.price.toLocaleString()}
                    </p>
                  )}
                  {selectedSize?.id === variant.id && (
                    <Check className="absolute top-1 right-1 h-3 w-3 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Weight / Quantity Variants Selection */}
      {weightVariants.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <Weight className="h-4 w-4" /> Select Quantity
          </h3>
          <div className="grid grid-cols-3 gap-2 max-w-md">
            {weightVariants.map((variant) => {
              const isDisabled = isWeightStockTracked && variant.stock === 0;
              return (
                <button
                  key={variant.id}
                  onClick={() => onSelectWeight(variant)}
                  className={`relative flex flex-col items-center justify-center rounded-lg border-2 px-2 py-2 transition-all text-center ${
                    selectedWeight?.id === variant.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border'
                  } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isDisabled}
                >
                  <p className="font-bold text-xs line-clamp-1">{variant.name}</p>
                  {variant.price > 0 && (
                    <p className="text-[10px] font-black text-primary mt-1">
                      LKR {variant.price.toLocaleString()}
                    </p>
                  )}
                  {selectedWeight?.id === variant.id && (
                    <Check className="absolute top-1 right-1 h-3 w-3 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Color Variants Selection */}
      {colorVariants.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <Tag className="h-4 w-4" /> Select Color
          </h3>
          <div className="flex flex-wrap gap-3">
            {colorVariants.map((variant) => {
              const colorInfo = predefinedColors.find(
                (c) => c.name.toLowerCase() === variant.name.toLowerCase()
              );
              const isSelected = selectedColor?.id === variant.id;
              const isDisabled = isColorStockTracked && variant.stock === 0;

              return (
                <button
                  key={variant.id}
                  onClick={() => onSelectColor(variant)}
                  className={`relative group flex flex-col items-center gap-1 p-1 rounded-full transition-all ${
                    isSelected
                      ? 'ring-2 ring-primary ring-offset-2'
                      : 'hover:scale-110'
                  } ${isDisabled ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                  disabled={isDisabled}
                  title={variant.name}
                >
                  <div
                    className={`h-8 w-8 rounded-full border shadow-sm ${
                      colorInfo?.color || 'bg-gray-200'
                    }`}
                  >
                    {isSelected && (
                      <div className="h-full w-full flex items-center justify-center">
                        <Check
                          className={`h-4 w-4 ${
                            ['White', 'Cream', 'Beige'].includes(
                              colorInfo?.name || ''
                            )
                              ? 'text-black'
                              : 'text-white'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-medium max-w-[60px] truncate">
                    {variant.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
