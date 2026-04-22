import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { UserProfile, FilterType, EditedImage, FILTER_METADATA, ProAdjustments, DEFAULT_ADJUSTMENTS } from './types';
import { getUserImageHistory, saveEditedImage, saveUserProfile } from './services/dbService';
import { processImage, suggestFilter } from './services/imageService';
import Navbar from './components/Navbar';
import Dropzone from './components/Dropzone';
import ComparisonSlider from './components/ComparisonSlider';
import FilterSelector from './components/FilterSelector';
import HistoryGrid from './components/HistoryGrid';
import FilterProcessingOverlay from './components/FilterProcessingOverlay';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Sparkles, RefreshCw, ChevronLeft, Share2, Loader2, Wand2, ArrowRight, User as UserIcon, Lock, LogIn, SlidersHorizontal, Activity, Layers, Palette } from 'lucide-react';
import { cn, compressImage } from './lib/utils';

// Pro Tools Components
import CurvesEditor from './components/editing/CurvesEditor';
import LevelsEditor from './components/editing/LevelsEditor';
import SelectiveColorEditor from './components/editing/SelectiveColorEditor';

const FREE_USAGE_LIMIT = 2;

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('original');
  const [suggestedFilter, setSuggestedFilter] = useState<FilterType | undefined>();
  const [history, setHistory] = useState<EditedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [styleImage, setStyleImage] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(0.5);
  const [adjustments, setAdjustments] = useState<ProAdjustments>(DEFAULT_ADJUSTMENTS);
  const [activeTab, setActiveTab] = useState<'general' | 'fine-tune'>('general');
  const [activeProTool, setActiveProTool] = useState<'basic' | 'curves' | 'levels' | 'color'>('basic');
  const [isStyleMode, setIsStyleMode] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [useCount, setUseCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isShared, setIsShared] = useState(false);

  useEffect(() => {
    const savedCount = localStorage.getItem('lumina_usage_count');
    if (savedCount) setUseCount(parseInt(savedCount));
  }, []);

  useEffect(() => {
    localStorage.setItem('lumina_usage_count', useCount.toString());
  }, [useCount]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const profile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email!,
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setUser(profile);
        loadHistory(fbUser.uid);
      } else {
        setUser(null);
        setHistory([]);
      }
    });
    return unsub;
  }, []);

  const loadHistory = async (uid: string) => {
    const images = await getUserImageHistory(uid);
    setHistory(images);
  };

  const handleFileSelect = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      
      // Optimize image for mobile performance immediately after upload
      const optimizedBase64 = await compressImage(base64, 1200, 0.8);
      
      setOriginalImage(optimizedBase64);
      setEditedImage(null);
      setSelectedFilter('original');
      
      // Auto suggest filter
      try {
        const suggestion = await suggestFilter(optimizedBase64);
        setSuggestedFilter(suggestion);
      } catch (err) {
        console.error("Auto-suggest failed", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const hasModifications = JSON.stringify(adjustments) !== JSON.stringify(DEFAULT_ADJUSTMENTS);
  const hasCustomPrompt = customPrompt.trim().length > 0;
  const canApply = hasModifications || hasCustomPrompt || selectedFilter !== 'original' || isStyleMode;

  const applyFilter = async (filter: FilterType | 'style_transfer', force: boolean = false) => {
    const isStyleTransfer = filter === 'style_transfer';
    
    if (!originalImage) return;
    
    // allow re-run if force is true (from Apply buttons)
    const isSameFilter = filter === selectedFilter && !isStyleTransfer;
    if (isSameFilter && !hasModifications && !hasCustomPrompt && !force) return;
    
    if (!user && useCount >= FREE_USAGE_LIMIT) {
      setShowPaywall(true);
      return;
    }
    
    if (!isStyleTransfer) {
      setSelectedFilter(filter as FilterType);
    }
    
    if (filter === 'original' && !hasCustomPrompt && !hasModifications && !isStyleTransfer) {
      setEditedImage(null);
      return;
    }

    setIsProcessing(true);
    try {
      const result = await processImage(
        originalImage, 
        filter, 
        'image/jpeg', 
        customPrompt,
        filter === 'style_transfer' ? styleImage || undefined : undefined,
        intensity,
        adjustments
      );
      setEditedImage(result);
      setUseCount(prev => prev + 1);
      
      // Auto save if user is logged in
      if (user) {
        // Compress for DB storage to fit in 1MB limit
        const [compOriginal, compEdited] = await Promise.all([
          compressImage(originalImage, 800, 0.6),
          compressImage(result, 800, 0.6)
        ]);

        await saveEditedImage({
          userId: user.uid,
          originalImageUrl: compOriginal,
          editedImageUrl: compEdited,
          filterType: filter,
          prompt: customPrompt || (filter !== 'style_transfer' ? FILTER_METADATA[filter].prompt : 'AI Style Transfer')
        });
        loadHistory(user.uid);
      }
    } catch (error) {
      console.error('Processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async () => {
    if (!editedImage) return;
    
    try {
      const blob = await (await fetch(editedImage)).blob();
      const file = new File([blob], 'edited-image.png', { type: 'image/png' });
      
      if (navigator.share) {
        await navigator.share({
          title: 'Check out my Lumina AI Creation!',
          text: 'I just edited this image using Lumina AI Image Studio.',
          files: [file],
        });
      } else {
        // Fallback: Copy link or show success
        await navigator.clipboard.writeText(window.location.href);
        setIsShared(true);
        setTimeout(() => setIsShared(false), 2000);
      }
    } catch (error) {
      console.error('Sharing failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-beige-100 selection:bg-brown-900 selection:text-beige-100 pb-20 overflow-x-hidden">
      <Navbar user={user} />

      <main className="max-w-6xl mx-auto px-4 md:px-6 pt-20 md:pt-32">
        {/* Hero Section */}
        <div className="text-center mb-6 md:mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-6xl md:text-8xl font-serif font-bold text-brown-900 mb-6 tracking-tight leading-tight"
          >
            Aesthetic <span className="italic font-light text-brown-900/80">Alchemy</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm md:text-lg text-brown-900/60 max-w-xl mx-auto font-sans leading-relaxed px-2 md:px-0"
          >
            Transform your photographs into timeless pieces of art with AI-powered vintage filters and cinematic grades.
          </motion.p>
        </div>

        <section className="relative">
          <AnimatePresence mode="wait">
            {!originalImage ? (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
              >
                <Dropzone onFileSelect={handleFileSelect} />
              </motion.div>
            ) : (
              <motion.div
                key="editor"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid lg:grid-cols-12 gap-8 md:gap-12"
              >
                {/* Editor Content */}
                <div className="lg:col-span-8 flex flex-col gap-6 md:gap-8 min-w-0">
                  <div className="vintage-card p-2 sm:p-4 md:p-6 relative">
                    <div className="relative w-full rounded-xl bg-beige-200 flex items-center justify-center overflow-hidden aspect-square md:aspect-video max-h-[60vh] md:max-h-[80vh]">
                      {editedImage ? (
                        <ComparisonSlider before={originalImage} after={editedImage} className="w-full h-full" />
                      ) : (
                        <img 
                          src={originalImage} 
                          alt="Preview" 
                          className={cn(
                            "max-w-full max-h-full w-auto h-auto object-contain transition-all duration-500",
                            isProcessing && "brightness-75"
                          )}
                          referrerPolicy="no-referrer"
                        />
                      )}
                      
                      {isProcessing && (
                        <div className="absolute inset-0 z-50 overflow-hidden pointer-events-none rounded-xl">
                          <FilterProcessingOverlay filter={selectedFilter} />
                          
                          {/* Scanning Line Effect */}
                          <motion.div 
                            initial={{ top: "-10%" }}
                            animate={{ top: "110%" }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/80 to-transparent shadow-[0_0_15px_rgba(255,255,255,0.8)] z-10"
                          />
                          
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-6 sm:p-8 text-center pointer-events-auto">
                            <div className="relative mb-4 sm:mb-6">
                              <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                className="w-16 h-16 sm:w-24 sm:h-24 border-2 border-dashed border-white/20 rounded-full"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-spin" />
                              </div>
                            </div>

                            <div className="max-w-xs w-full space-y-4 px-4">
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-1"
                              >
                                <h4 className="font-serif italic text-xl sm:text-2xl text-white tracking-wide">Developing</h4>
                                <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] font-bold text-white/50">
                                  {isStyleMode ? 'Applying Style Transfer' : (customPrompt ? 'Applying Custom Mood' : `Applying ${FILTER_METADATA[selectedFilter].label}`)}
                                </p>
                              </motion.div>

                              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
                                <motion.div 
                                  initial={{ width: "0%" }}
                                  animate={{ width: "95%" }}
                                  transition={{ duration: 4, ease: "easeOut" }}
                                  className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                
                <div className="flex gap-4">
                    <button 
                      onClick={() => setIsStyleMode(false)}
                      className={cn(
                        "px-6 py-2 rounded-full text-sm font-bold uppercase tracking-widest transition-all",
                        !isStyleMode ? "bg-brown-900 text-beige-100 shadow-lg" : "bg-white text-brown-900 hover:bg-beige-200"
                      )}
                    >
                      Filters
                    </button>
                    <button 
                      onClick={() => setIsStyleMode(true)}
                      className={cn(
                        "px-6 py-2 rounded-full text-sm font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                        isStyleMode ? "bg-brown-900 text-beige-100 shadow-lg" : "bg-white text-brown-900 hover:bg-beige-200"
                      )}
                    >
                      <Sparkles className="w-4 h-4" />
                      AI Style Transfer
                    </button>
                  </div>

                  {isStyleMode ? (
                    <div className="vintage-card p-4 md:p-6 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-brown-900/40">1. Artistic Style Reference</label>
                          <div 
                            className="aspect-video rounded-xl border-2 border-dashed border-brown-900/10 bg-beige-100 flex flex-col items-center justify-center cursor-pointer hover:bg-beige-200 transition-colors overflow-hidden group"
                            onClick={() => document.getElementById('style-upload')?.click()}
                          >
                            {styleImage ? (
                              <img src={styleImage} alt="Style Reference" className="w-full h-full object-cover" />
                            ) : (
                              <>
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-sm">
                                  <Wand2 className="w-5 h-5 text-brown-900" />
                                </div>
                                <p className="text-xs font-bold text-brown-900/40">Upload style image</p>
                              </>
                            )}
                            <input 
                              id="style-upload"
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (re) => setStyleImage(re.target?.result as string);
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex-1 space-y-4">
                          <div className="flex flex-col h-full justify-between">
                            <div className="space-y-4">
                              <label className="text-[10px] uppercase tracking-widest font-bold text-brown-900/40">2. Apply Transformation</label>
                              <p className="text-xs text-brown-900/60 leading-relaxed">
                                Use the global intensity slider in the controls panel to adjust how strongly the artistic style is blended with your image.
                              </p>
                            </div>
                            
                            <button 
                              onClick={() => applyFilter('style_transfer')}
                              disabled={!styleImage || isProcessing}
                              className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-4"
                            >
                              <Sparkles className="w-4 h-4" />
                              Run Alchemy
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <FilterSelector 
                      selected={selectedFilter} 
                      onSelect={applyFilter} 
                      suggested={suggestedFilter}
                      isLoggedIn={!!user}
                      isProcessing={isProcessing}
                    />
                  )}
                </div>

                {/* Sidebar Controls */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  <div className="vintage-card p-6 md:p-8 flex flex-col gap-6">
                    <div className="flex flex-col gap-4">
                      <div>
                        <h3 className="text-2xl font-serif font-bold text-brown-900 mb-2">Controls</h3>
                        <p className="text-sm text-brown-900/60">Refine and export your creation.</p>
                      </div>

                      {/* Tab Switcher */}
                      <div className="flex p-1 bg-beige-100 rounded-xl border border-beige-300">
                        <button 
                          onClick={() => setActiveTab('general')}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2 text-[10px] uppercase tracking-widest font-bold transition-all rounded-lg",
                            activeTab === 'general' ? "bg-white text-brown-900 shadow-sm" : "text-brown-900/40 hover:text-brown-900/60"
                          )}
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          General
                        </button>
                        <button 
                          onClick={() => setActiveTab('fine-tune')}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2 text-[10px] uppercase tracking-widest font-bold transition-all rounded-lg",
                            activeTab === 'fine-tune' ? "bg-white text-brown-900 shadow-sm" : "text-brown-900/40 hover:text-brown-900/60"
                          )}
                        >
                          <Activity className="w-3.5 h-3.5" />
                          Fine-Tune
                        </button>
                      </div>
                    </div>

                    <div className="space-y-6 pt-2">
                      <AnimatePresence mode="wait">
                        {activeTab === 'general' ? (
                          <motion.div 
                            key="general"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="space-y-6"
                          >
                            <div className="space-y-4">
                              <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-brown-900/40">Effect Intensity ({Math.round(intensity * 100)}%)</label>
                                <button 
                                  onClick={() => applyFilter(selectedFilter, true)}
                                  disabled={isProcessing || !canApply}
                                  className={cn(
                                    "px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all flex items-center gap-1.5",
                                    canApply && !isProcessing 
                                      ? "bg-brown-900 text-white shadow-md animate-pulse" 
                                      : "text-brown-900 hover:opacity-70 disabled:opacity-30"
                                  )}
                                >
                                  <RefreshCw className={cn("w-3 h-3", isProcessing && "animate-spin")} />
                                  {canApply && !isProcessing ? 'Render Changes' : 'Apply'}
                                </button>
                              </div>
                              <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.05" 
                                value={intensity}
                                onChange={(e) => setIntensity(parseFloat(e.target.value))}
                                disabled={isProcessing}
                                className="w-full h-1.5 bg-beige-300 rounded-lg appearance-none cursor-pointer accent-brown-900"
                              />
                              <div className="flex justify-between px-1 text-[9px] font-bold text-brown-900/20 uppercase">
                                <span>Subtle</span>
                                <span>Strong</span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] uppercase tracking-widest font-bold text-brown-900/40 ml-1">Custom Mood (Optional)</label>
                              <div className="relative">
                                <input 
                                  type="text"
                                  value={customPrompt}
                                  onChange={(e) => setCustomPrompt(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && customPrompt.trim() && applyFilter(selectedFilter, true)}
                                  disabled={isProcessing}
                                  placeholder="Add film grain, make it colder..."
                                  className="w-full bg-beige-100 border border-beige-300 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brown-900/20 focus:border-brown-900 transition-all placeholder:text-brown-900/30 disabled:opacity-50"
                                />
                                <Wand2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-900/30" />
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div 
                            key="fine-tune"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="space-y-6"
                          >
                            <div className="flex gap-2">
                              {[
                                { id: 'basic', icon: SlidersHorizontal, label: 'Basic' },
                                { id: 'curves', icon: Activity, label: 'Curves' },
                                { id: 'levels', icon: Layers, label: 'Levels' },
                                { id: 'color', icon: Palette, label: 'Color' }
                              ].map((tool) => (
                                <button
                                  key={tool.id}
                                  onClick={() => setActiveProTool(tool.id as any)}
                                  className={cn(
                                    "flex-1 py-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all border",
                                    activeProTool === tool.id 
                                      ? "bg-brown-900 text-white border-brown-900 shadow-md" 
                                      : "bg-white text-brown-900/40 border-beige-300 hover:border-brown-900/30"
                                  )}
                                >
                                  <tool.icon className="w-4 h-4" />
                                  <span className="text-[8px] uppercase font-bold tracking-tighter">{tool.label}</span>
                                </button>
                              ))}
                            </div>

                            <div className="min-h-[280px]">
                              {activeProTool === 'basic' && (
                                <div className="space-y-4">
                                  {[
                                    { id: 'exposure', label: 'Exposure', min: -2, max: 2, step: 0.1 },
                                    { id: 'contrast', label: 'Contrast', min: 0, max: 200, step: 1 },
                                    { id: 'highlights', label: 'Highlights', min: 0, max: 200, step: 1 },
                                    { id: 'shadows', label: 'Shadows', min: 0, max: 200, step: 1 },
                                    { id: 'saturation', label: 'Saturation', min: 0, max: 200, step: 1 },
                                    { id: 'vibrance', label: 'Vibrance', min: -100, max: 100, step: 1 },
                                  ].map((param) => (
                                    <div key={param.id} className="space-y-1.5 px-1">
                                      <div className="flex justify-between text-[10px] font-bold text-brown-900/60 uppercase">
                                        <span>{param.label}</span>
                                        <span>{(adjustments[param.id as keyof ProAdjustments] as number) > 0 && param.id === 'exposure' ? '+' : ''}{adjustments[param.id as keyof ProAdjustments] as number}</span>
                                      </div>
                                      <input 
                                        type="range" 
                                        min={param.min} 
                                        max={param.max} 
                                        step={param.step}
                                        value={adjustments[param.id as keyof ProAdjustments] as number}
                                        onChange={(e) => {
                                          const val = parseFloat(e.target.value);
                                          setAdjustments(prev => ({ ...prev, [param.id]: val }));
                                        }}
                                        className="w-full h-1 bg-beige-300 rounded-lg appearance-none cursor-pointer accent-brown-900"
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}

                              {activeProTool === 'curves' && (
                                <CurvesEditor 
                                  points={adjustments.curves} 
                                  onChange={(curves) => setAdjustments(prev => ({ ...prev, curves }))} 
                                />
                              )}

                              {activeProTool === 'levels' && (
                                <LevelsEditor 
                                  levels={adjustments.levels} 
                                  onChange={(levels) => setAdjustments(prev => ({ ...prev, levels }))} 
                                />
                              )}

                              {activeProTool === 'color' && (
                                <SelectiveColorEditor 
                                  data={adjustments.selectiveColor} 
                                  onChange={(selectiveColor) => setAdjustments(prev => ({ ...prev, selectiveColor }))} 
                                />
                              )}
                            </div>

                            <div className="space-y-4 pt-2">
                              <div className="p-3 bg-beige-100 rounded-xl border border-beige-300/50">
                                <p className="text-[9px] text-brown-900/50 leading-relaxed italic text-center">
                                  Pro adjustments are unbaked. Click "Render Fine-Tune" to process your changes with AI.
                                </p>
                              </div>

                              <button 
                                onClick={() => applyFilter(selectedFilter, true)}
                                disabled={isProcessing}
                                className={cn(
                                  "w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 group",
                                  hasModifications && !isProcessing 
                                    ? "bg-brown-900 text-white animate-pulse" 
                                    : "bg-brown-900/80 text-white hover:bg-brown-900"
                                )}
                              >
                                <RefreshCw className={cn("w-4 h-4 transition-transform group-hover:rotate-180 duration-500", isProcessing && "animate-spin")} />
                                Render Fine-Tune
                              </button>
                              
                              <button 
                                onClick={() => setAdjustments(DEFAULT_ADJUSTMENTS)}
                                className="w-full text-[10px] text-center uppercase tracking-widest font-bold text-brown-900/40 hover:text-brown-900 transition-colors"
                              >
                                Reset all tools
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="pt-4 border-t border-beige-300 space-y-3">
                        <button 
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = editedImage || originalImage;
                            link.download = `lumina-art-${Date.now()}.png`;
                            link.click();
                          }}
                          disabled={isProcessing}
                          className="w-full btn-primary flex items-center justify-center gap-2 py-4"
                        >
                          <Download className="w-5 h-5" />
                          Download High-Res
                        </button>

                        <button 
                          onClick={() => {
                            setOriginalImage(null);
                            setEditedImage(null);
                            setSelectedFilter('original');
                            setCustomPrompt('');
                            setAdjustments(DEFAULT_ADJUSTMENTS);
                          }}
                          disabled={isProcessing}
                          className="w-full btn-secondary flex items-center justify-center gap-2 py-4"
                        >
                          <RefreshCw className="w-5 h-5" />
                          Start Over
                        </button>
                      </div>
                    </div>

                    {!user && (
                      <div className="bg-brown-900/5 p-4 rounded-2xl border border-brown-900/10">
                        <p className="text-xs text-brown-900/80 font-medium leading-relaxed">
                          <Sparkles className="w-3 h-3 inline mr-1 mb-1" />
                          Sign in to save your history and sync your creations across devices.
                        </p>
                      </div>
                    )}
                  </div>

                  <div 
                    onClick={() => !isProcessing && handleShare()}
                    className={cn(
                      "vintage-card p-6 border-dashed border-2 flex items-center justify-between group transition-colors",
                      isProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-beige-50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-beige-200 rounded-full flex items-center justify-center group-hover:bg-white transition-colors">
                        <Share2 className="w-5 h-5 text-brown-900" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brown-900">{isShared ? 'Link Copied!' : 'Share with the world'}</p>
                        <p className="text-xs text-brown-900/40 font-medium uppercase tracking-wider">Instagram / X</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* User History / Dashboard */}
        {user ? (
          <div className="mt-32 border-t border-beige-300 pt-16">
            <div className="grid md:grid-cols-4 gap-8 mb-16">
              <div className="md:col-span-1 vintage-card p-8 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-beige-300 mb-4 bg-beige-100 flex items-center justify-center">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <UserIcon className="w-10 h-10 text-brown-900/20" />
                  )}
                </div>
                <h3 className="font-serif font-bold text-xl text-brown-900">{user.displayName || 'Creator'}</h3>
                <p className="text-xs text-brown-900/40 uppercase tracking-widest font-bold mt-1">Free Member</p>
                <div className="mt-6 w-full pt-6 border-t border-beige-300 flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-brown-900/40">Total Saved</span>
                    <span className="text-brown-900">{history.length}</span>
                  </div>
                </div>
              </div>
              <div className="md:col-span-3">
                {history.length > 0 ? (
                  <HistoryGrid 
                    images={history} 
                    hideHeader
                    onSelect={(img) => {
                      setOriginalImage(img.originalImageUrl);
                      setEditedImage(img.editedImageUrl);
                      setSelectedFilter(img.filterType);
                      setCustomPrompt(img.prompt);
                    }} 
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center bg-brown-900/5 rounded-3xl p-12 border-2 border-dashed border-brown-900/10">
                    <Sparkles className="w-12 h-12 text-brown-900/20 mb-4" />
                    <h3 className="font-serif font-bold text-2xl text-brown-900 mb-2">No masterpieces yet</h3>
                    <p className="text-sm text-brown-900/60 max-w-xs">Upload your first image above to start your aesthetic journey.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : history.length > 0 && (
          <HistoryGrid 
            images={history} 
            onSelect={(img) => {
              setOriginalImage(img.originalImageUrl);
              setEditedImage(img.editedImageUrl);
              setSelectedFilter(img.filterType);
            }} 
          />
        )}
      </main>

      {/* Paywall Modal */}
      <AnimatePresence>
        {showPaywall && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-brown-950/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="vintage-card max-w-md w-full p-8 text-center"
            >
              <div className="w-20 h-20 bg-beige-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-brown-900" />
              </div>
              <h3 className="font-serif font-bold text-3xl text-brown-900 mb-4">Artistic Potential Awaits</h3>
              <p className="text-sm text-brown-900/60 leading-relaxed mb-8">
                You've reached the free limit. Connect with Google to unlock unlimited generations, premium filters, and cloud history storage.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setShowPaywall(false)}
                  className="btn-primary py-4 text-sm tracking-widest font-bold uppercase transition-all flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Sign Up & Continue
                </button>
                <button 
                  onClick={() => setShowPaywall(false)}
                  className="text-xs text-brown-900/40 hover:text-brown-900/80 transition-colors uppercase font-bold tracking-widest"
                >
                  Maybe later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Decorative footer */}
      <footer className="mt-40 text-center py-20 border-t border-beige-300">
        <p className="font-serif italic text-brown-900/40 text-xl tracking-wide">
          Crafted with Lumina AI Studio — 2026
        </p>
      </footer>
    </div>
  );
}
