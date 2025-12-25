// Shared product categories used across the application
export const productCategories = [
  { value: 'pooja', label: 'Pooja Items' },
  { value: 'flowers', label: 'Flowers & Garlands' },
  { value: 'incense', label: 'Incense & Camphor' },
  { value: 'lamps', label: 'Lamps & Diyas' },
  { value: 'books', label: 'Religious Books' },
  { value: 'idols', label: 'Idols & Statues' },
  { value: 'prasad', label: 'Prasadam' },
  { value: 'clothing', label: 'Clothing & Accessories' },
  { value: 'jewelry', label: 'Temple Jewelry' },
  { value: 'other', label: 'Other' },
];

export const getCategoryLabel = (value: string): string => {
  const category = productCategories.find((c) => c.value === value);
  return category?.label || value;
};

export const getCategoryValue = (label: string): string => {
  const category = productCategories.find((c) => c.label === label);
  return category?.value || label;
};
