
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { LoopConfig, Vibe, Complexity, LofiConfig } from '../types'; // Added Complexity
import { GEMINI_MODEL_NAME, DEFAULT_LOFI_CONFIG, KEYS, SCALE_TYPES } from '../constants';
import { getRandomElement } from "../utils/musicUtils";

const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.warn("API_KEY environment variable not found. Gemini features will be limited.");
}

// parseGeneratedElements is no longer needed as 'elements' is removed.

export const fetchLoopConfig = async (vibe: Vibe, userSelectedComplexity: Complexity): Promise<LoopConfig> => {
  if (!ai) {
    console.warn("Gemini AI not initialized. Returning default config for Drums & Bass.");
    return {
      tempo: vibe === Vibe.CHILL ? 90 : vibe === Vibe.FOCUS ? 110 : 120,
      key: getRandomElement(KEYS),
      scaleType: getRandomElement(SCALE_TYPES) as LoopConfig['scaleType'],
      complexity: userSelectedComplexity, // Use user-selected complexity
      drumKitStyle: getRandomElement(['classicLoFi', 'dustyBreaks', 'minimal808']) as LoopConfig['drumKitStyle'],
      bassStyle: getRandomElement(['simpleRootNotes', 'walkingEighths', 'syncopatedFunk']) as LoopConfig['bassStyle'],
      lofiConfig: { ...DEFAULT_LOFI_CONFIG, vinylCrackleLevel: 0 },
    };
  }

  const prompt = `
    Generate a detailed configuration for an 8-bar lo-fi music loop.
    The desired vibe is: "${vibe}".
    The user will separately choose the complexity/density of notes. Your task is to provide musically coherent styles and parameters for Drums and Bass that fit the vibe.

    Return ONLY a JSON object matching this exact structure:
    {
      "tempo": number, // BPM, e.g., 80-130
      "key": string, // musical key, e.g., "C", "F#", "Bb"
      "scaleType": string, // "major", "minor", "minorPentatonic", or "majorPentatonic"
      "drumKitStyle": string, // "classicLoFi", "dustyBreaks", or "minimal808"
      "bassStyle": string, // "simpleRootNotes", "walkingEighths", or "syncopatedFunk"
      "lofiConfig": {
        "masterFilterCutoff": number, // Hz, e.g., 2000-8000
        "vinylCrackleLevel": number, // Set to 0.0 to disable vinyl hiss noise.
        "tapeSaturation": number, // 0.0 to 0.5
        "pitchWobbleRate": number, // Hz, e.g., 0.1-1.0
        "pitchWobbleDepth": number // cents, e.g., 2-6 (lower for clearer pitch)
      }
    }

    Constraints:
    - Tempo should align with the vibe (e.g., Chill: 70-95, Focus: 90-110, Groove: 100-125, Dreamy: 60-90).
    - Key must be one of: ${KEYS.join(', ')}.
    - scaleType must be one of: ${SCALE_TYPES.join(', ')}.
    - Drum and bass styles should be appropriate for the vibe.
    - lofiConfig values should be subtle and contribute to a pleasant lo-fi sound. vinylCrackleLevel must be 0.0. pitchWobbleDepth should be low (2-6 cents) for pitch clarity.
    - Ensure the JSON is valid. Do not include any explanations or markdown.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
    });
    
    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    const partialParsedConfig = JSON.parse(jsonStr) as Omit<LoopConfig, 'complexity'>;
    
    const fullConfig: LoopConfig = {
        ...partialParsedConfig,
        complexity: userSelectedComplexity, // Add user-selected complexity
    };

    if (!KEYS.includes(fullConfig.key)) fullConfig.key = getRandomElement(KEYS);
    if (!SCALE_TYPES.includes(fullConfig.scaleType)) fullConfig.scaleType = 'minorPentatonic';
    
    if (fullConfig.lofiConfig) {
        fullConfig.lofiConfig.vinylCrackleLevel = 0;
        if (fullConfig.lofiConfig.pitchWobbleDepth > 6) fullConfig.lofiConfig.pitchWobbleDepth = 4;
    } else {
        fullConfig.lofiConfig = { ...DEFAULT_LOFI_CONFIG, vinylCrackleLevel: 0 };
    }

    return fullConfig;

  } catch (error) {
    console.error("Error fetching loop configuration from Gemini:", error);
    console.warn("Falling back to default local configuration due to Gemini API error.");
     return { 
      tempo: vibe === Vibe.CHILL ? 85 : vibe === Vibe.FOCUS ? 100 : 115,
      key: getRandomElement(KEYS),
      scaleType: getRandomElement(SCALE_TYPES) as LoopConfig['scaleType'],
      complexity: userSelectedComplexity, // Add user-selected complexity
      drumKitStyle: getRandomElement(['classicLoFi', 'dustyBreaks']) as LoopConfig['drumKitStyle'],
      bassStyle: getRandomElement(['simpleRootNotes', 'walkingEighths']) as LoopConfig['bassStyle'],
      lofiConfig: { ...DEFAULT_LOFI_CONFIG, vinylCrackleLevel: 0 },
    };
  }
};
