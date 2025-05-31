export interface WinePairing {
  wineName: string;
  characteristics: string;
  pairingExplanation: string;
  wineType: string; // Added wine type (e.g., "赤ワイン", "白ワイン", "ロゼワイン")
}

// This interface matches the expected JSON structure from Gemini
export interface GeminiWineDetail {
  wineName: string;
  characteristics: string;
  pairingExplanation: string;
  wineType: string; // Added wine type
}

export interface SuggestedDish {
  dishName: string;
}
