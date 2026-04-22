import { EditedImage } from '../types';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Download, History, RefreshCcw } from 'lucide-react';

interface HistoryGridProps {
  images: EditedImage[];
  onSelect: (image: EditedImage) => void;
  hideHeader?: boolean;
}

export default function HistoryGrid({ images, onSelect, hideHeader }: HistoryGridProps) {
  if (images.length === 0) return null;

  return (
    <div className={cn("w-full", !hideHeader && "mt-24")}>
      {!hideHeader && (
        <div className="flex items-center gap-3 mb-8">
          <History className="w-5 h-5 text-brown-900/40" />
          <h2 className="text-2xl font-serif font-bold text-brown-900">Your Gallery</h2>
        </div>
      )}

      <div className={cn(
        "grid gap-6",
        hideHeader 
          ? "grid-cols-2 lg:grid-cols-3" 
          : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      )}>
        {images.map((image) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -8 }}
            className="group relative"
          >
            <div 
              onClick={() => onSelect(image)}
              className="aspect-square rounded-2xl overflow-hidden shadow-sm border border-beige-300 cursor-pointer"
            >
              <img 
                src={image.editedImageUrl} 
                alt={image.filterType} 
                className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-125"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const link = document.createElement('a');
                    link.href = image.editedImageUrl;
                    link.download = `lumina-${image.filterType}-${Date.now()}.png`;
                    link.click();
                  }}
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-brown-900 hover:scale-110 transition-transform"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-widest font-bold text-brown-900/40">{image.filterType}</p>
              <p className="text-xs text-brown-900/60">{new Date(image.createdAt).toLocaleDateString()}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
