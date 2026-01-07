import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { ImagePlus, X, Send, Loader2, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PostUpload = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // படத்தை தேர்ந்தெடுக்கும் போது நடக்கும் மாற்றம்
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB Limit
        toast({ title: "File too large", description: "Please upload an image under 5MB", variant: "destructive" });
        return;
      }
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
  };

  const handlePostSubmit = async () => {
    if (!imageFile || !user) {
      toast({ title: "Image required", description: "Please select an image to post." });
      return;
    }

    setLoading(true);
    try {
      // 1. Supabase Storage-க்கு படத்தை அப்லோட் செய்தல்
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('post-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      // 2. படத்தின் Public URL-ஐப் பெறுதல்
      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath);

      // 3. Database (posts table)-ல் விபரங்களைச் சேமித்தல்
      const { error: dbError } = await (supabase.from('posts' as any).insert({
        vendor_id: user.id,
        image_url: publicUrl,
        caption: caption,
      }) as any);

      if (dbError) throw dbError;

      toast({ title: "Post Success!", description: "Your post is now live on the feed." });
      
      // Reset Form
      setCaption('');
      setImageFile(null);
      setPreviewUrl(null);

    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 font-outfit animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <Camera className="text-primary h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold">Create New Post</h2>
          <p className="text-muted-foreground text-sm">Share temple glimpses with your followers</p>
        </div>
      </div>

      <div className="space-y-6 bg-card border rounded-[2rem] p-6 shadow-xl">
        {/* Media Upload Area */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {!previewUrl ? (
              <motion.label 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-muted rounded-[1.5rem] cursor-pointer hover:bg-muted/30 transition-all group"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <div className="p-4 bg-primary/5 rounded-full group-hover:scale-110 transition-transform">
                    <ImagePlus className="w-10 h-10 text-primary/60" />
                  </div>
                  <p className="mt-4 text-sm font-bold text-muted-foreground">Click to upload photo</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">JPEG, PNG up to 5MB</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </motion.label>
            ) : (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative h-80 w-full overflow-hidden rounded-[1.5rem] border">
                <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                <Button 
                  onClick={removeImage}
                  variant="destructive" size="icon" className="absolute top-4 right-4 rounded-full shadow-lg"
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Caption Area */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Caption</label>
          <Textarea 
            placeholder="Write something about this post..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="min-h-[120px] rounded-2xl border-muted bg-muted/10 focus-visible:ring-primary resize-none p-4"
          />
        </div>

        {/* Submit Button */}
        <Button 
          onClick={handlePostSubmit}
          disabled={loading || !imageFile}
          className="w-full h-14 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-2xl shadow-glow transition-all hover:scale-[1.02]"
        >
          {loading ? (
            <span className="flex items-center gap-2"><Loader2 className="animate-spin h-5 w-5" /> Posting...</span>
          ) : (
            <span className="flex items-center gap-2">Post to Temple Feed <Send className="h-4 w-4" /></span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PostUpload;