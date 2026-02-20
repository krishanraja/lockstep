// AvatarUpload - Profile picture upload with preview
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Camera, Loader2, Check, X, Crop } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl: string | null;
  displayName: string | null;
  onAvatarChange: (url: string) => void;
}

export const AvatarUpload = ({
  userId,
  currentAvatarUrl,
  displayName,
  onAvatarChange,
}: AvatarUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCropPreview, setShowCropPreview] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      setError('Please upload a JPEG, PNG, GIF, or WebP image');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    // Create preview and show crop option
    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCropImage(dataUrl);
      setShowCropPreview(true);
    };
    reader.readAsDataURL(file);
  };

  // Process and crop image to square (1:1 aspect ratio)
  const processAndCropImage = async (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Draw centered square crop
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;
        ctx.drawImage(img, x, y, size, size, 0, 0, size, size);
        
        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  };

  const handleConfirmCrop = async () => {
    if (!cropImage) return;
    try {
      const processed = await processAndCropImage(cropImage);
      setPreviewUrl(processed);
      setShowCropPreview(false);
      setCropImage(null);
      
      // Auto-upload after crop
      const blob = await (await fetch(processed)).blob();
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      await uploadFile(file);
    } catch (err: any) {
      console.error('Error processing crop:', err);
      setError('Failed to process image');
      setShowCropPreview(false);
      setCropImage(null);
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setError(null);
    
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      onAvatarChange(publicUrl);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      setError(err.message || 'Failed to upload image');
      setPreviewUrl(null);
      setCropImage(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploading(true);
    setError(null);

    try {
      // Update profile to remove avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      onAvatarChange('');
      setPreviewUrl(null);
    } catch (err: any) {
      console.error('Error removing avatar:', err);
      setError(err.message || 'Failed to remove image');
    } finally {
      setIsUploading(false);
    }
  };

  const avatarUrl = previewUrl || currentAvatarUrl;
  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : null;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar display */}
      <div className="relative group">
        <div 
          className={`w-24 h-24 rounded-full overflow-hidden border-2 border-border 
            ${isUploading ? 'opacity-50' : ''} transition-opacity`}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName || 'Profile'}
              className="w-full h-full object-cover"
              onError={() => setPreviewUrl(null)}
            />
          ) : initials ? (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">{initials}</span>
            </div>
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
              <User className="w-10 h-10 text-primary" />
            </div>
          )}
        </div>

        {/* Upload overlay */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="absolute inset-0 rounded-full bg-background/80 opacity-0 group-hover:opacity-100
            flex items-center justify-center transition-opacity cursor-pointer
            disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-foreground" />
          ) : (
            <Camera className="w-6 h-6 text-foreground" />
          )}
        </button>

        {/* Success indicator */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-confirmed
                flex items-center justify-center"
            >
              <Check className="w-4 h-4 text-background" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Camera className="w-4 h-4 mr-2" />
          {avatarUrl ? 'Change' : 'Upload'}
        </Button>
        {avatarUrl && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveAvatar}
            disabled={isUploading}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="w-4 h-4 mr-2" />
            Remove
          </Button>
        )}
      </div>

      {/* Crop preview modal */}
      <AnimatePresence>
        {showCropPreview && cropImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => {
              setShowCropPreview(false);
              setCropImage(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Crop your avatar</h3>
              <div className="relative mb-4">
                <img
                  src={cropImage}
                  alt="Crop preview"
                  className="w-full rounded-xl"
                  style={{ aspectRatio: '1/1', objectFit: 'cover' }}
                />
                <div className="absolute inset-0 border-4 border-primary rounded-xl pointer-events-none" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Your avatar will be cropped to a square. The center portion will be used.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCropPreview(false);
                    setCropImage(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmCrop}
                  className="flex-1"
                >
                  <Crop className="w-4 h-4 mr-2" />
                  Use This
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
    </div>
  );
};

export default AvatarUpload;
