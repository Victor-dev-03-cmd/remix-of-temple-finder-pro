import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building, MapPin, ExternalLink, Package, Loader2, Edit, Image as ImageIcon, Plus, X } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useVendorTemple } from '@/hooks/useVendorTemple';
import { useProducts } from '@/hooks/useProducts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import VendorTempleForm from '@/components/vendor/VendorTempleForm';
import TicketManagement from '@/components/vendor/TicketManagement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const VendorTemple = () => {
  const { user } = useAuth();
  const { temple, application, loading, refetch } = useVendorTemple(user?.id);
  const { products } = useProducts({ vendorId: user?.id, status: 'approved' });
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // --- Gallery Upload Handler ---
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !temple) return;

    setIsUploading(true);
    const toastId = toast.loading("Uploading images...");
    
    // gallery_images காலத்தை பயன்படுத்துகிறோம்
    const currentImages = temple.gallery_images || [];
    const newUrls: string[] = [...currentImages];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `gallery/${temple.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('temple-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('temple-images')
          .getPublicUrl(filePath);

        newUrls.push(publicUrl);
      }

      const { error: updateError } = await supabase
        .from('temples')
        .update({ gallery_images: newUrls })
        .eq('id', temple.id);

      if (updateError) throw updateError;

      toast.success("Gallery updated successfully", { id: toastId });
      refetch(); 
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(`Upload failed: ${error.message}`, { id: toastId });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // --- Remove Image Handler ---
  const removeImage = async (urlToRemove: string) => {
    if (!temple) return;
    
    const toastId = toast.loading("Removing image...");
    const updatedImages = (temple.gallery_images || []).filter((url: string) => url !== urlToRemove);
    
    try {
      const { error } = await supabase
        .from('temples')
        .update({ gallery_images: updatedImages })
        .eq('id', temple.id);
      
      if (error) throw error;
      
      toast.success("Image removed", { id: toastId });
      refetch();
    } catch (error: any) {
      toast.error(`Failed to remove: ${error.message}`, { id: toastId });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!temple) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Temple</h1>
            <p className="text-muted-foreground">Create your temple to start selling products</p>
          </div>
          <VendorTempleForm onSuccess={refetch} businessName={application?.business_name} />
        </div>
      </DashboardLayout>
    );
  }

  if (isEditing) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Edit Temple</h1>
            <p className="text-muted-foreground">Update your temple information</p>
          </div>
          <VendorTempleForm 
            onSuccess={() => { setIsEditing(false); refetch(); }}
            onCancel={() => setIsEditing(false)}
            temple={temple}
            isEditing
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Responsive Header: Mobile-ல் ஒன்றன் கீழ் ஒன்றாக வரும் */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Temple</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage your temple and products</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="flex-1 sm:flex-none">
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
            <Link to={`/temples/${temple.id}`} className="flex-1 sm:flex-none">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <ExternalLink className="h-4 w-4" /> View Page
              </Button>
            </Link>
          </div>
        </div>

        {/* Temple Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden">
            <div className="grid md:grid-cols-3 gap-0">
              <div className="relative h-48 md:h-full md:min-h-[200px] bg-muted">
                {temple.image_url ? (
                  <img src={temple.image_url} alt={temple.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Building className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="md:col-span-2 p-6">
                <CardHeader className="p-0 mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-xl sm:text-2xl">{temple.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-4 w-4" /> {temple.district}, {temple.province}
                      </CardDescription>
                    </div>
                    <Badge className="w-fit bg-success/10 text-success border-success/20">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {temple.description && <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{temple.description}</p>}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm"><Package className="h-4 w-4" /><span>Live Products</span></div>
                      <p className="mt-1 text-xl sm:text-2xl font-bold">{products.length}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm"><Building className="h-4 w-4" /><span>Business</span></div>
                      <p className="mt-1 text-base sm:text-lg font-semibold truncate">{application?.business_name || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* --- GALLERY MANAGEMENT SECTION --- */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl">Gallery Images</CardTitle>
              <CardDescription>Upload photos for devotees</CardDescription>
            </div>
            <div className="relative w-full sm:w-auto">
              <input 
                type="file" 
                id="gallery-upload"
                multiple 
                accept="image/*" 
                className="hidden" 
                onChange={handleGalleryUpload} 
                disabled={isUploading} 
              />
              <Button asChild disabled={isUploading} className="w-full sm:w-auto">
                <label htmlFor="gallery-upload" className="cursor-pointer flex items-center justify-center gap-2">
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add Photos
                </label>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {temple.gallery_images && temple.gallery_images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {temple.gallery_images.map((img: string, index: number) => (
                  <div key={index} className="group relative aspect-square rounded-xl overflow-hidden border bg-muted shadow-sm">
                    <img src={img} className="h-full w-full object-cover" alt={`Gallery ${index}`} />
                    <button 
                      onClick={() => removeImage(img)}
                      className="absolute top-2 right-2 p-1.5 bg-destructive/90 text-destructive-foreground rounded-full shadow-md sm:opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-xl bg-muted/20 border-muted-foreground/10">
                <ImageIcon className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No gallery images yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ticket Management - Mobile friendly by default */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <TicketManagement templeId={temple.id} />
        </motion.div>

        {/* Bottom Quick Stats */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Package className="h-5 w-5 text-primary" /></div>
                <div><p className="text-xs sm:text-sm text-muted-foreground">Products</p><p className="text-xl sm:text-2xl font-bold">{products.length}</p></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><Building className="h-5 w-5 text-success" /></div>
                <div><p className="text-xs sm:text-sm text-muted-foreground">Status</p><p className="text-base sm:text-lg font-semibold text-success">Verified</p></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10"><ImageIcon className="h-5 w-5 text-warning" /></div>
                <div><p className="text-xs sm:text-sm text-muted-foreground">Gallery</p><p className="text-xl sm:text-2xl font-bold">{temple.gallery_images?.length || 0}</p></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VendorTemple;