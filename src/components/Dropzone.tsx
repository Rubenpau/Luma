import React, { useState, useCallback } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  className?: string;
}

export default function Dropzone({ onFileSelect, className }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      className={cn(
        "relative w-full h-64 md:h-80 border-2 border-dashed rounded-3xl transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group",
        isDragging ? "border-brown-900 bg-beige-200" : "border-beige-300 hover:border-brown-900/50 hover:bg-beige-50",
        className
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-upload')?.click()}
    >
      <input 
        id="file-upload"
        type="file" 
        className="hidden" 
        accept="image/*"
        onChange={handleChange}
      />
      
      <motion.div 
        initial={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        className="w-16 h-16 bg-beige-200 rounded-2xl flex items-center justify-center text-brown-900 mb-6 group-hover:bg-brown-900 group-hover:text-white transition-colors duration-300"
      >
        <Upload className="w-8 h-8" />
      </motion.div>

      <h3 className="text-xl font-serif font-medium text-brown-900 mb-2">Upload your masterpiece</h3>
      <p className="text-sm text-brown-900/60 font-sans">
        Drag and drop or <span className="text-brown-900 font-semibold underline underline-offset-4 decoration-brown-900/30">browse</span>
      </p>

      <div className="absolute bottom-6 flex gap-4">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-brown-900/40 font-semibold">
          <ImageIcon className="w-3 h-3" />
          Supports PNG, JPG, WEBP
        </div>
      </div>
    </div>
  );
}
