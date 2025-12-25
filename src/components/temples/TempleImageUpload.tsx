import { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTempleImageUpload } from '@/hooks/useTempleImageUpload';
import { cn } from '@/lib/utils';

interface TempleImageUploadProps {
  currentImageUrl?: string | null;
  onImageUploaded: (url: string) => void;
  onImageRemoved?: () => void;
  templeId?: string;
  className?: string;
}

export const TempleImageUpload = ({
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  templeId,
  className,
}: TempleImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const { uploadImage, deleteImage, isUploading, uploadProgress } = useTempleImageUpload();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    // Upload file
    const uploadedUrl = await uploadImage(file, templeId);
    
    if (uploadedUrl) {
      setPreviewUrl(uploadedUrl);
      onImageUploaded(uploadedUrl);
    } else {
      // Revert preview on failure
      setPreviewUrl(currentImageUrl || null);
    }

    // Cleanup local preview URL
    URL.revokeObjectURL(localPreview);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (previewUrl && previewUrl.includes('temple-images')) {
      await deleteImage(previewUrl);
    }
    setPreviewUrl(null);
    onImageRemoved?.();
  };

  return (
    <div className={cn('space-y-3', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {previewUrl ? (
        <div className="relative group">
          <img
            src={previewUrl}
            alt="Temple preview"
            className="w-full h-48 object-cover rounded-lg border border-border"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-1" />
              Change
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ImageIcon className="h-10 w-10 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Click to upload temple image
          </span>
          <span className="text-xs text-muted-foreground/70">
            Max 5MB, JPG/PNG/WebP
          </span>
        </button>
      )}

      {isUploading && (
        <div className="space-y-1">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}
    </div>
  );
};
