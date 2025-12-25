import { useRef, useState, useEffect } from 'react';
import { Upload, X, Image, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useProductImageUpload } from '@/hooks/useProductImageUpload';
import { cn } from '@/lib/utils';

interface ProductImageUploadProps {
  currentImageUrl?: string | null;
  onImageUploaded: (url: string) => void;
  onImageRemoved?: () => void;
  productId?: string;
  className?: string;
}

const ProductImageUpload = ({
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  productId,
  className,
}: ProductImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const { uploadImage, deleteImage, isUploading, uploadProgress } = useProductImageUpload();

  useEffect(() => {
    setPreviewUrl(currentImageUrl || null);
  }, [currentImageUrl]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create local preview
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    // Upload to storage
    const uploadedUrl = await uploadImage(file, productId);
    
    if (uploadedUrl) {
      setPreviewUrl(uploadedUrl);
      onImageUploaded(uploadedUrl);
    } else {
      // Reset preview on failure
      setPreviewUrl(currentImageUrl || null);
    }

    // Clean up local preview URL
    URL.revokeObjectURL(localPreview);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (previewUrl && previewUrl !== currentImageUrl) {
      // It's a newly uploaded image, delete it
      await deleteImage(previewUrl);
    }
    setPreviewUrl(null);
    onImageRemoved?.();
  };

  return (
    <div className={cn('space-y-2', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative">
          <div className="relative aspect-square w-full max-w-[200px] overflow-hidden rounded-lg border border-border bg-muted">
            <img
              src={previewUrl}
              alt="Product preview"
              className="h-full w-full object-cover"
            />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              Change
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              disabled={isUploading}
              className="text-destructive"
            >
              <X className="mr-1 h-3 w-3" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={cn(
            'flex aspect-square w-full max-w-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary hover:bg-muted/50',
            isUploading && 'cursor-not-allowed opacity-50'
          )}
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Image className="mb-2 h-8 w-8 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Click to upload</span>
              <span className="text-xs text-muted-foreground">Max 5MB</span>
            </>
          )}
        </div>
      )}

      {isUploading && uploadProgress > 0 && (
        <Progress value={uploadProgress} className="h-2 w-full max-w-[200px]" />
      )}
    </div>
  );
};

export default ProductImageUpload;
