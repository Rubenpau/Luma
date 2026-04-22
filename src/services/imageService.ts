import { ai } from '../lib/gemini';
import { FilterType, FILTER_METADATA, ProAdjustments, Point, DEFAULT_ADJUSTMENTS } from '../types';

const translateCurves = (points: Point[]) => {
  if (points.length <= 2 && points[0].x === 0 && points[0].y === 0 && points[1].x === 1 && points[1].y === 1) return '';
  
  // Analyze curve shape
  const mid = points[Math.floor(points.length / 2)];
  let description = 'Curves: ';
  if (mid.y > mid.x) description += 'Brightened midtones, ';
  else if (mid.y < mid.x) description += 'Darkened midtones, ';
  
  const isSCurve = points.some(p => p.x < 0.5 && p.y < p.x) && points.some(p => p.x > 0.5 && p.y > p.x);
  if (isSCurve) description += 'High contrast S-curve (crushed shadows, boosted highlights), ';
  
  return description;
};

const translateAdjustments = (adj: ProAdjustments) => {
  let text = 'Professional Adjustments:\n';
  if (adj.exposure !== 0) text += `- Exposure: ${adj.exposure > 0 ? '+' : ''}${adj.exposure.toFixed(2)} stops\n`;
  if (adj.contrast !== 100) text += `- Contrast: ${adj.contrast}%\n`;
  if (adj.highlights !== 100) text += `- Highlights: ${adj.highlights - 100 > 0 ? 'Recovery' : 'Compression'} at ${adj.highlights}%\n`;
  if (adj.shadows !== 100) text += `- Shadows: ${adj.shadows - 100 > 0 ? 'Lifted' : 'Darkened'} at ${adj.shadows}%\n`;
  if (adj.saturation !== 100) text += `- Saturation: ${adj.saturation}%\n`;
  if (adj.vibrance !== 0) text += `- Vibrance: ${adj.vibrance > 0 ? '+' : ''}${adj.vibrance}%\n`;
  
  const curveText = translateCurves(adj.curves);
  if (curveText) text += `- ${curveText}\n`;
  
  if (adj.levels.blackIn !== 0 || adj.levels.whiteIn !== 255 || adj.levels.gamma !== 1.0) {
    text += `- Levels: Input Black ${adj.levels.blackIn}, Input White ${adj.levels.whiteIn}, Gamma ${adj.levels.gamma}\n`;
  }
  
  const selColor = Object.entries(adj.selectiveColor)
    .filter(([_, v]) => v.cyan !== 0 || v.magenta !== 0 || v.yellow !== 0 || v.black !== 0)
    .map(([color, v]) => `${color.charAt(0).toUpperCase() + color.slice(1)} [C:${v.cyan}% M:${v.magenta}% Y:${v.yellow}% K:${v.black}%]`)
    .join(', ');
    
  if (selColor) text += `- Selective Color Adjustments: ${selColor}\n`;
  
  return text;
};

export const processImage = async (
  base64Image: string, 
  filterType: FilterType | 'style_transfer',
  mimeType: string = 'image/jpeg',
  customPrompt?: string,
  styleImage?: string,
  intensity: number = 0.5,
  adjustments?: ProAdjustments
): Promise<string> => {
  const hasModifications = adjustments && JSON.stringify(adjustments) !== JSON.stringify(DEFAULT_ADJUSTMENTS);

  if (filterType === 'original' && !customPrompt && !hasModifications) return base64Image;

  let instruction = '';
  const parts: any[] = [
    {
      inlineData: {
        data: base64Image.split(',')[1] || base64Image,
        mimeType: mimeType,
      },
    }
  ];

  const proText = hasModifications ? translateAdjustments(adjustments) : '';

  if (filterType === 'style_transfer' && styleImage) {
    parts.push({
      inlineData: {
        data: styleImage.split(',')[1] || styleImage,
        mimeType: mimeType,
      },
    });
    instruction = `Apply artistic style transfer. The second image provides the style reference. 
    Intensity: ${intensity * 100}%. 
    ${proText}
    ${customPrompt ? `Additional Instructions: ${customPrompt}` : ''}
    Return ONLY the final processed image. Ensure highest professional quality.`;
  } else {
    const filterPrompt = filterType !== 'style_transfer' ? FILTER_METADATA[filterType].prompt : '';
    
    if (filterType === 'original' && hasModifications) {
      instruction = `Action: Precise Professional Retouching.
      
      CRITICAL: Apply the following adjustments directly as ABSOLUTE commands, not suggestions. 
      The resulting image must reflect these values as if processed in Lightroom/Capture One.
      
      ${proText}
      ${customPrompt ? `Target Aesthetic: ${customPrompt}` : ''}
      
      Global Strength Scaling: ${intensity * 100}% (Blend the final result with original).
      
      Output: Return ONLY the high-resolution edited image. No text.`;
    } else {
      instruction = `Transform the image based on these parameters:
      Aesthetic Goal: ${filterPrompt || 'Professional Neutral Enhancement'}
      Global Intensity: ${intensity * 100}%
      ${proText}
      ${customPrompt ? `Custom User Instructions: ${customPrompt}` : ''}
      Return ONLY the edited image at high resolution.`;
    }
  }
  
  parts.push({ text: instruction });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts,
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error('No image returned from AI');
  } catch (error) {
    console.error('AI processing failed:', error);
    throw error;
  }
};

export const suggestFilter = async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<FilterType> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Better for analysis
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1] || base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: `Analyze this image and suggest the best aesthetic filter from this list: ${Object.keys(FILTER_METADATA).filter(f => f !== 'original').join(', ')}. Return ONLY the filter name in lowercase.`,
          },
        ],
      },
    });

    const suggestion = response.text?.trim().toLowerCase() as FilterType;
    return suggestion in FILTER_METADATA ? suggestion : 'vintage';
  } catch (error) {
    console.error('AI suggestion failed:', error);
    return 'vintage';
  }
};
