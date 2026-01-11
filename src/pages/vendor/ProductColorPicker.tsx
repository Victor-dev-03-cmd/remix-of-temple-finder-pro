import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Palette, Check, ArrowLeft, Plus } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface ColorOption {
  name: string;
  color: string;
  hex: string;
}

const predefinedColors: ColorOption[] = [
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

const ProductColorPicker = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/vendor/products';
  
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#000000');

  const toggleColor = (colorName: string) => {
    setSelectedColors(prev => 
      prev.includes(colorName) 
        ? prev.filter(c => c !== colorName)
        : [...prev, colorName]
    );
  };

  const addCustomColor = () => {
    if (!customColorName.trim()) {
      toast({ title: 'Error', description: 'Please enter a color name.', variant: 'destructive' });
      return;
    }
    if (selectedColors.includes(customColorName)) {
      toast({ title: 'Error', description: 'This color is already added.', variant: 'destructive' });
      return;
    }
    setSelectedColors(prev => [...prev, customColorName]);
    setCustomColorName('');
    toast({ title: 'Color Added', description: `${customColorName} has been added to your selection.` });
  };

  const handleApplyColors = () => {
    if (selectedColors.length === 0) {
      toast({ title: 'No Colors Selected', description: 'Please select at least one color.', variant: 'destructive' });
      return;
    }
    
    // Store selected colors in sessionStorage for the product form to pick up
    sessionStorage.setItem('selectedProductColors', JSON.stringify(selectedColors));
    toast({ title: 'Colors Applied', description: `${selectedColors.length} color(s) will be added as variants.` });
    navigate(returnUrl);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(returnUrl)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Color Picker</h1>
            <p className="text-muted-foreground">Select colors for your product variants</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Color Selection Grid */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Available Colors
                </CardTitle>
                <CardDescription>Click to select multiple colors for your product</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                  {predefinedColors.map((colorOption) => {
                    const isSelected = selectedColors.includes(colorOption.name);
                    return (
                      <motion.button
                        key={colorOption.name}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleColor(colorOption.name)}
                        className={`relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                          isSelected 
                            ? 'border-primary bg-primary/5 shadow-md' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className={`h-10 w-10 rounded-full ${colorOption.color} shadow-sm`}>
                          {isSelected && (
                            <div className="h-full w-full flex items-center justify-center">
                              <Check className={`h-5 w-5 ${colorOption.name === 'White' || colorOption.name === 'Beige' || colorOption.name === 'Cream' ? 'text-black' : 'text-white'}`} />
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-medium text-center truncate w-full">
                          {colorOption.name}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Custom Color */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Add Custom Color</CardTitle>
                <CardDescription>Create a custom color variant</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="customColorName">Color Name</Label>
                    <Input
                      id="customColorName"
                      placeholder="e.g., Midnight Blue"
                      value={customColorName}
                      onChange={(e) => setCustomColorName(e.target.value)}
                      className="w-48"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customColorHex">Color Preview</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="customColorHex"
                        value={customColorHex}
                        onChange={(e) => setCustomColorHex(e.target.value)}
                        className="h-10 w-16 rounded cursor-pointer border border-border"
                      />
                      <span className="text-sm text-muted-foreground font-mono">{customColorHex}</span>
                    </div>
                  </div>
                  <Button onClick={addCustomColor} variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Color
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selected Colors Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Selected Colors ({selectedColors.length})</CardTitle>
                <CardDescription>Colors that will be added as variants</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedColors.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No colors selected yet
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedColors.map((colorName) => {
                      const predefined = predefinedColors.find(c => c.name === colorName);
                      return (
                        <motion.div
                          key={colorName}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="flex items-center justify-between p-2 rounded-lg border border-border bg-muted/30"
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className={`h-6 w-6 rounded-full ${predefined?.color || 'bg-gray-400'} shadow-sm`}
                              style={!predefined ? { backgroundColor: customColorHex } : undefined}
                            />
                            <span className="text-sm font-medium">{colorName}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => toggleColor(colorName)}
                          >
                            ×
                          </Button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-4 border-t border-border space-y-2">
                  <Button 
                    onClick={handleApplyColors} 
                    className="w-full gap-2"
                    disabled={selectedColors.length === 0}
                  >
                    <Check className="h-4 w-4" />
                    Apply {selectedColors.length} Color{selectedColors.length !== 1 ? 's' : ''}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate(returnUrl)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProductColorPicker;
