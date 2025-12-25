import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface GalleryImage {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
}

const BentoGallery = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      const { data } = await supabase
        .from('home_gallery_images')
        .select('id, image_url, title, description')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(6);

      setImages(data || []);
      setLoading(false);
    };

    fetchImages();
  }, []);

  if (loading || images.length === 0) return null;

  // Define bento grid patterns based on image count
  const getBentoClass = (index: number, total: number) => {
    if (total >= 6) {
      // 6+ images: classic bento pattern
      const patterns = [
        'col-span-2 row-span-2', // Large feature
        'col-span-1 row-span-1', // Small
        'col-span-1 row-span-1', // Small
        'col-span-1 row-span-2', // Tall
        'col-span-1 row-span-1', // Small
        'col-span-1 row-span-1', // Small
      ];
      return patterns[index] || 'col-span-1 row-span-1';
    } else if (total >= 4) {
      // 4-5 images
      const patterns = [
        'col-span-2 row-span-2',
        'col-span-1 row-span-1',
        'col-span-1 row-span-1',
        'col-span-2 row-span-1',
        'col-span-1 row-span-1',
      ];
      return patterns[index] || 'col-span-1 row-span-1';
    } else if (total >= 2) {
      // 2-3 images
      const patterns = [
        'col-span-2 row-span-2',
        'col-span-1 row-span-2',
        'col-span-1 row-span-1',
      ];
      return patterns[index] || 'col-span-1 row-span-1';
    }
    // 1 image
    return 'col-span-3 row-span-2';
  };

  return (
    <section className="py-16 lg:py-24 bg-muted/30">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
            Temple Gallery
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Experience the beauty and serenity of our sacred temples
          </p>
        </motion.div>

        <div className="grid grid-cols-3 gap-4 auto-rows-[200px] md:auto-rows-[250px]">
          {images.slice(0, 6).map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`${getBentoClass(index, images.length)} group relative overflow-hidden rounded-xl`}
            >
              <img
                src={image.image_url}
                alt={image.title || 'Temple gallery image'}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {(image.title || image.description) && (
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  {image.title && (
                    <h3 className="font-semibold text-white text-lg">
                      {image.title}
                    </h3>
                  )}
                  {image.description && (
                    <p className="text-white/80 text-sm mt-1">
                      {image.description}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BentoGallery;