import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Search, Image, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PexelsPhoto {
  id: number;
  src: {
    medium: string;
    large: string;
  };
  alt: string;
  photographer: string;
}

interface EventPhotoSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
  currentImage?: string;
  eventType?: string;
}

export function EventPhotoSelector({
  isOpen,
  onClose,
  onSelect,
  currentImage,
  eventType = 'event',
}: EventPhotoSelectorProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'search'>('search');
  const [searchQuery, setSearchQuery] = useState(eventType);
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(currentImage || null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      console.log('[EventPhotoSelector] Invoking fetch-pexels with query:', searchQuery);
      
      const { data, error: fnError } = await supabase.functions.invoke('fetch-pexels', {
        body: { query: searchQuery, per_page: 12 },
      });
      
      console.log('[EventPhotoSelector] Response:', { data, error: fnError });
      
      if (fnError) {
        console.error('[EventPhotoSelector] Function error:', fnError);
        // Provide more specific error messages based on error type
        if (fnError.message?.includes('not configured')) {
          setError('Photo search not configured. Please contact support.');
        } else if (fnError.message?.includes('FunctionNotFound') || fnError.message?.includes('404')) {
          setError('Photo search service unavailable. Please try again later.');
        } else {
          setError('Failed to search photos. Please try again.');
        }
        setPhotos([]);
        return;
      }
      
      // Check for API-level errors in the response
      if (data?.error) {
        console.error('[EventPhotoSelector] API error in response:', data.error);
        if (data.error.includes('not configured')) {
          setError('Photo search not configured. Please contact support.');
        } else {
          setError('Failed to search photos. Please try again.');
        }
        setPhotos([]);
        return;
      }
      
      if (data?.photos) {
        console.log('[EventPhotoSelector] Found', data.photos.length, 'photos');
        setPhotos(data.photos);
      } else {
        console.log('[EventPhotoSelector] No photos in response');
        setPhotos([]);
      }
    } catch (err: any) {
      console.error('[EventPhotoSelector] Exception:', err);
      // Parse error for more helpful messages
      const errorMessage = err?.message || String(err);
      if (errorMessage.includes('NetworkError') || errorMessage.includes('fetch')) {
        setError('Network error. Please check your connection.');
      } else if (errorMessage.includes('timeout')) {
        setError('Request timed out. Please try again.');
      } else {
        setError('Failed to search photos. Please try again.');
      }
      setPhotos([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }
    
    setError(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setUploadPreview(dataUrl);
      setSelectedPhoto(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPhoto = (photoUrl: string) => {
    setSelectedPhoto(photoUrl);
    setUploadPreview(null);
  };

  const handleConfirm = () => {
    if (selectedPhoto) {
      onSelect(selectedPhoto);
      onClose();
    }
  };

  // Search on initial open and auto-select first photo
  useEffect(() => {
    if (isOpen && photos.length === 0 && !isSearching && activeTab === 'search') {
      handleSearch();
    }
  }, [isOpen, activeTab]);

  // Auto-select first photo when photos are loaded
  useEffect(() => {
    if (photos.length > 0 && !selectedPhoto && activeTab === 'search') {
      setSelectedPhoto(photos[0].src.large);
    }
  }, [photos, activeTab]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-lg bg-background rounded-t-3xl max-h-[90vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Choose Event Photo</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 py-3 text-sm font-medium transition-colors
                ${activeTab === 'search' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <Search className="w-4 h-4 inline mr-2" />
              Search Photos
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-3 text-sm font-medium transition-colors
                ${activeTab === 'upload' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Upload
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'search' ? (
              <div className="space-y-4">
                {/* Search input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search for photos..."
                    className="flex-1 px-4 py-2 rounded-xl bg-muted border border-border/50
                      text-foreground placeholder:text-muted-foreground
                      focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground
                      disabled:opacity-50 hover:opacity-90 transition-opacity"
                  >
                    {isSearching ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Photo grid */}
                {isSearching ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : photos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((photo) => (
                      <button
                        key={photo.id}
                        onClick={() => handleSelectPhoto(photo.src.large)}
                        className={`relative aspect-square rounded-xl overflow-hidden
                          ${selectedPhoto === photo.src.large 
                            ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
                            : ''
                          }`}
                      >
                        <img
                          src={photo.src.medium}
                          alt={photo.alt}
                          className="w-full h-full object-cover"
                        />
                        {selectedPhoto === photo.src.large && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <Check className="w-8 h-8 text-primary" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Image className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-sm">Search for photos to get started</p>
                  </div>
                )}

                {/* Pexels attribution */}
                {photos.length > 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Photos provided by{' '}
                    <a 
                      href="https://www.pexels.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Pexels
                    </a>
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Upload area */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {uploadPreview ? (
                  <div className="relative">
                    <img
                      src={uploadPreview}
                      alt="Upload preview"
                      className="w-full aspect-video object-cover rounded-xl"
                    />
                    <button
                      onClick={() => {
                        setUploadPreview(null);
                        setSelectedPhoto(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="absolute top-2 right-2 p-2 rounded-full bg-background/80 
                        hover:bg-background transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video rounded-xl border-2 border-dashed border-border/50
                      flex flex-col items-center justify-center gap-3
                      text-muted-foreground hover:border-primary hover:text-primary
                      transition-colors"
                  >
                    <Upload className="w-12 h-12" />
                    <span className="text-sm font-medium">Click to upload</span>
                    <span className="text-xs">JPG, PNG up to 5MB</span>
                  </button>
                )}
              </div>
            )}

            {/* Error message */}
            {error && (
              <p className="text-sm text-destructive text-center mt-4">{error}</p>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-muted text-muted-foreground font-medium
                hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedPhoto}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium
                hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Use Photo
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}




