import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Link as LinkIcon, Trash2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';

interface ImageUploadPickerProps {
  label: string;
  sublabel?: string;
  value?: string;
  onChange: (dataUrlOrLink: string) => void;
  aspectRatio?: 'square' | 'video' | 'banner';
  placeholderText?: string;
  className?: string;
}

// Helper to auto-compress and optimize images from camera or gallery
export const compressImageFile = (
  file: File,
  maxWidth = 900,
  maxHeight = 900,
  quality = 0.82
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try webp first, fallback to jpeg
        try {
          const webpData = canvas.toDataURL('image/webp', quality);
          if (webpData && webpData.startsWith('data:image/webp')) {
            resolve(webpData);
            return;
          }
        } catch {
          // fallback
        }
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Failed to load image file'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export const ImageUploadPicker: React.FC<ImageUploadPickerProps> = ({
  label,
  sublabel,
  value,
  onChange,
  aspectRatio = 'square',
  placeholderText,
  className = '',
}) => {
  const { isHindi, t } = useLanguage();
  const [showUrlField, setShowUrlField] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const defaultPlaceholder = isHindi
    ? 'कैमरा या गैलरी से फोटो लगाएं'
    : 'Upload photo using camera or gallery';

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileProcess = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage(
        isHindi
          ? 'कृपया केवल फोटो/इमेज फाइल चुनें (JPEG, PNG, WebP).'
          : 'Please select a valid image file (JPEG, PNG, WebP).'
      );
      return;
    }

    setProcessing(true);
    setErrorMessage('');

    try {
      const maxDim = aspectRatio === 'banner' ? 1200 : 800;
      const compressed = await compressImageFile(file, maxDim, maxDim, 0.82);
      onChange(compressed);
    } catch (err: any) {
      console.error('Image compression error:', err);
      setErrorMessage(
        isHindi
          ? 'फोटो लोड नहीं हो सकी, कृपया दोबारा प्रयास करें।'
          : 'Failed to process photo, please try again.'
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const getPreviewClasses = () => {
    switch (aspectRatio) {
      case 'banner':
        return 'w-full h-36 sm:h-44 object-cover';
      case 'video':
        return 'w-full h-48 object-cover';
      case 'square':
      default:
        return 'w-24 h-24 sm:w-28 sm:h-28 object-cover';
    }
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Hidden File Inputs */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={cameraInputRef}
        onChange={handleInputChange}
        className="hidden"
        title={isHindi ? 'कैमरा से फोटो खींचें' : 'Take photo with camera'}
      />
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        ref={galleryInputRef}
        onChange={handleInputChange}
        className="hidden"
        title={isHindi ? 'गैलरी से फोटो चुनें' : 'Choose photo from gallery'}
      />

      {/* Header Label & URL toggle */}
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-black text-slate-800">
            {label}
          </label>
          {sublabel && (
            <p className="text-[11px] text-slate-500 font-semibold">{sublabel}</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowUrlField(!showUrlField)}
          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer transition"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{showUrlField ? (isHindi ? 'वेब लिंक छिपाएं' : 'Hide URL field') : (isHindi ? 'या वेब लिंक डालें' : 'Or enter image URL')}</span>
        </button>
      </div>

      {/* Optional Web URL Input fallback */}
      {showUrlField && (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 animate-in fade-in">
          <label className="text-[11px] font-bold text-slate-600 block">
            {isHindi ? 'इमेज वेब लिंक:' : 'Image Web URL:'}
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition"
              >
                {isHindi ? 'हटाएं' : 'Clear'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Preview Card when image is loaded */}
      {value ? (
        <div className="p-3.5 bg-emerald-50/50 rounded-2xl border-2 border-emerald-300/80 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative shrink-0 rounded-xl overflow-hidden border-2 border-white shadow-md bg-white">
              <img
                src={value}
                alt="Selected preview"
                className={getPreviewClasses()}
              />
              <div className="absolute top-1.5 right-1.5">
                <span className="p-1 rounded-full bg-emerald-600 text-white shadow-xs flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-xs font-black uppercase tracking-wider">
                  {isHindi ? 'फोटो तैयार है' : 'Photo Ready'}
                </span>
                {value.startsWith('data:') && (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                    {isHindi ? 'कैमरा / डिवाइस से ली गई' : 'Captured from Device'}
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-600 truncate max-w-sm">
                {value.startsWith('data:')
                  ? (isHindi ? 'फोटो सफलतापूर्वक प्रोसेस हो चुकी है' : 'Photo successfully processed and ready')
                  : value}
              </p>

              {/* Action Buttons to Retake or Change */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>{isHindi ? 'कैमरा से दोबारा लें' : 'Retake with Camera'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span>{isHindi ? 'गैलरी से बदलें' : 'Choose from Gallery'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer"
                  title={isHindi ? 'फोटो हटाएं' : 'Remove photo'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isHindi ? 'हटाएं' : 'Remove'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* When No Image is Selected -> Large, Bold Touch-Friendly Upload Area */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`p-4 sm:p-5 rounded-2xl border-2 border-dashed transition text-center ${
            dragActive
              ? 'border-emerald-500 bg-emerald-50/70 scale-[0.99]'
              : 'border-slate-300 bg-slate-50/70 hover:bg-slate-50 hover:border-emerald-400'
          }`}
        >
          {processing ? (
            <div className="py-6 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-sm font-black text-slate-800">
                {isHindi ? 'फोटो प्रोसेस हो रही है...' : 'Processing & compressing photo...'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shadow-2xs">
                  <ImageIcon className="w-6 h-6" />
                </div>
              </div>

              <div>
                <p className="text-sm font-black text-slate-900">
                  {placeholderText || defaultPlaceholder}
                </p>
                <p className="text-xs font-bold text-slate-500 mt-0.5">
                  {isHindi
                    ? 'कैमरा से सीधी फोटो लें या गैलरी से चुनें'
                    : 'Take a direct camera photo or choose from gallery'}
                </p>
              </div>

              {/* Two Prominent Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 transition cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>{isHindi ? '📷 कैमरा से फोटो खींचें' : '📷 Take Camera Photo'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 border-2 border-slate-300 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-2xs transition cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span>{isHindi ? '🖼️ गैलरी से चुनें' : '🖼️ Choose from Gallery'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error message if any */}
      {errorMessage && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-bold animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
