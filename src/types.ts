export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EditedImage {
  id: string;
  userId: string;
  originalImageUrl: string;
  editedImageUrl: string;
  filterType: FilterType;
  prompt: string;
  createdAt: string;
}

export type FilterType = 
  | 'original'
  | 'vintage' 
  | 'retro' 
  | 'cinematic' 
  | 'glow' 
  | 'bw' 
  | 'warm' 
  | 'cold'
  | 'instagram'
  | 'noir'
  | 'vibrant'
  | 'pastel'
  | 'cyberpunk'
  | 'brutalist'
  | 'style_transfer';

export interface Point {
  x: number;
  y: number;
}

export interface ProAdjustments {
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  saturation: number;
  vibrance: number;
  curves: Point[];
  levels: {
    blackIn: number;
    whiteIn: number;
    gamma: number;
    blackOut: number;
    whiteOut: number;
  };
  selectiveColor: Record<string, {
    cyan: number;
    magenta: number;
    yellow: number;
    black: number;
  }>;
}

export const DEFAULT_ADJUSTMENTS: ProAdjustments = {
  exposure: 0,
  contrast: 100,
  highlights: 100,
  shadows: 100,
  saturation: 100,
  vibrance: 0,
  curves: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
  levels: {
    blackIn: 0,
    whiteIn: 255,
    gamma: 1.0,
    blackOut: 0,
    whiteOut: 255
  },
  selectiveColor: {
    reds: { cyan: 0, magenta: 0, yellow: 0, black: 0 },
    yellows: { cyan: 0, magenta: 0, yellow: 0, black: 0 },
    greens: { cyan: 0, magenta: 0, yellow: 0, black: 0 },
    cyans: { cyan: 0, magenta: 0, yellow: 0, black: 0 },
    blues: { cyan: 0, magenta: 0, yellow: 0, black: 0 },
    magentas: { cyan: 0, magenta: 0, yellow: 0, black: 0 },
    whites: { cyan: 0, magenta: 0, yellow: 0, black: 0 },
    neutrals: { cyan: 0, magenta: 0, yellow: 0, black: 0 },
    blacks: { cyan: 0, magenta: 0, yellow: 0, black: 0 },
  }
};

export interface FilterInfo {
  label: string;
  prompt: string;
  isPremium?: boolean;
}

export const FILTER_METADATA: Record<FilterType, FilterInfo> = {
  original: { label: 'Original', prompt: '' },
  style_transfer: { label: 'Style Transfer', prompt: 'Apply artistic style transfer' },
  vintage: { 
    label: 'Vintage', 
    prompt: 'Apply a vintage 1970s aesthetic. Add slight grain, warm yellow-orange tint, and soft fade in the shadows. Make it look like an old film photograph.' 
  },
  retro: { 
    label: 'Retro Film', 
    prompt: 'Apply a retro film look with high contrast and slight chromatic aberration. Add dust and scratches textures. Deep blacks and vibrant reds.' 
  },
  cinematic: { 
    label: 'Cinematic', 
    prompt: 'Apply a high-end cinematic color grade. Teal and orange professional color scheme, anamorphic lens flare effect, and subtle letterbox aspect.' 
  },
  glow: { 
    label: 'Soft Glow', 
    prompt: 'Add a dreamy, ethereal soft glow effect. Bloom in the highlights, soft focus atmosphere, and gentle pastel enhancement.' 
  },
  bw: { 
    label: 'B&W Aesthetic', 
    prompt: 'Convert to a premium black and white aesthetic. Deep contrast, fine grain, and silver gelatin print look. Elegant and timeless.' 
  },
  warm: { 
    label: 'Warm Tones', 
    prompt: 'Enhance with golden hour warm tones. Soft honey light, increased amber saturation, and cozy atmosphere.' 
  },
  cold: { 
    label: 'Cold Tones', 
    prompt: 'Apply a cool, moody blue aesthetic. Arctic tones, crisp clarity, and winter morning atmosphere.' 
  },
  instagram: { 
    label: 'Luxe Filter', 
    prompt: 'Apply a modern professional influencer-style filter. Bright and airy, vibrant clarity, polished skin tones, and rich highlights.' 
  },
  noir: {
    label: 'Film Noir',
    prompt: 'Apply a classic film noir aesthetic. High contrast black and white, dramatic lighting, sharp shadows, and classic detective movie mood.'
  },
  vibrant: {
    label: 'Vibrant Pop',
    prompt: 'Hyper-saturate the colors while maintaining realistic skin tones. High energy, bright highlights, and pop-art inspired color balance.'
  },
  pastel: {
    label: 'Pastel Dream',
    prompt: 'Convert the image colors to a soft pastel palette. High key exposure, low contrast, and mint/peach/lavender color grading.'
  },
  cyberpunk: {
    label: 'Cyberpunk',
    prompt: 'Apply a neon cyberpunk aesthetic. Deep blues and vibrant magentas, neon glow effects, and futuristic high-tech atmosphere.',
    isPremium: true
  },
  brutalist: {
    label: 'Brutalist',
    prompt: 'Apply a raw, brutalist architectural aesthetic. Heavy texture, high contrast, industrial gray tones, and sharp focus.',
    isPremium: true
  }
};
