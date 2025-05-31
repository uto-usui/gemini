
export enum Vibe {
  CHILL = "Chill",
  FOCUS = "Focus",
  GROOVE = "Groove",
  DREAMY = "Dreamy",
}

export enum Complexity {
  SPARSE = "Sparse", // 少なめ・シンプル
  STANDARD = "Standard", // 標準的
  COMPLEX = "Complex", // 多め・複雑
}

export type BassOscillatorType = "sine" | "square" | "sawtooth" | "triangle";

export interface LofiConfig {
  masterFilterCutoff: number; // Hz
  vinylCrackleLevel: number; // 0 to 1
  tapeSaturation: number; // 0 to 1
  pitchWobbleRate: number; // Hz
  pitchWobbleDepth: number; // cents
}

export interface LoopConfig {
  tempo: number; // BPM
  key: string; // e.g., "C", "Db", "A#"
  scaleType: "major" | "minor" | "minorPentatonic" | "majorPentatonic";
  complexity: Complexity; 
  drumKitStyle: "classicLoFi" | "dustyBreaks" | "minimal808";
  bassStyle: "simpleRootNotes" | "walkingEighths" | "syncopatedFunk";
  lofiConfig: LofiConfig;
}

export type InstrumentType = "kick" | "snare" | "hihat" | "openHihat" | "bass";
export type VisualizerInstrumentType = InstrumentType;


export interface NoteEvent {
  time: number; // in beats, relative to start of loop
  pitch: string | number; // Note name (e.g., "C4") or frequency for synths, or drum type for drums
  duration: number; // in beats
  velocity: number; // 0-1
  instrument: InstrumentType; 
}

export interface BassTimbreParameters {
  oscillatorType: BassOscillatorType;
  filterCutoff: number;
  filterQ: number;
  gain: number;
}

// For PatternVisualizer
export interface VisualizerNote {
  id: string; // Unique ID for React key
  instrument: VisualizerInstrumentType;
  startStep: number;
  durationSteps: number; // For bass notes, how many steps it spans
  velocity: number;
}
