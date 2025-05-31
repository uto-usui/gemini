
import { Vibe, Complexity } from './types';

export const APP_TITLE = "Lo-Fi Loop Generator";
export const GEMINI_MODEL_NAME = "gemini-2.5-flash-preview-04-17";

export const VIBE_OPTIONS: { id: Vibe; label: string; description: string }[] = [
  { id: Vibe.CHILL, label: "Chill", description: "Relaxed, slow tempos, mellow sounds." },
  { id: Vibe.FOCUS, label: "Focus", description: "Steady, medium tempos, unobtrusive patterns." },
  { id: Vibe.GROOVE, label: "Groove", description: "Upbeat, rhythmic, head-nodding beats." },
  { id: Vibe.DREAMY, label: "Dreamy", description: "Ethereal, atmospheric, spacious sounds." },
];

export const COMPLEXITY_OPTIONS: { id: Complexity; label: string; description: string }[] = [
  { id: Complexity.SPARSE, label: "Sparse (少なめ)", description: "Fewer notes, simpler patterns. Good for a background feel." },
  { id: Complexity.STANDARD, label: "Standard (標準)", description: "Balanced note count and complexity. Versatile." },
  { id: Complexity.COMPLEX, label: "Complex (多め)", description: "More notes, intricate rhythms. Creates a busier feel." },
];

export const STEPS_PER_BAR = 16; // 16th notes
export const TOTAL_BARS = 8;
export const TOTAL_STEPS = STEPS_PER_BAR * TOTAL_BARS;

export const DEFAULT_LOFI_CONFIG = {
  masterFilterCutoff: 3000, 
  vinylCrackleLevel: 0, 
  tapeSaturation: 0.15,
  pitchWobbleRate: 0.2,
  pitchWobbleDepth: 4, 
};

export const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const SCALE_TYPES = ["major", "minor", "minorPentatonic", "majorPentatonic"];

export const DEFAULT_API_KEY_WARNING = "API_KEY environment variable not set. Gemini features will be disabled.";
