
export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const noteToFrequency = (note: string): number => {
  const octave = parseInt(note.slice(-1));
  const keyName = note.slice(0, -1);
  let keyNumber = NOTE_NAMES.indexOf(keyName);

  if (keyNumber < 3) { // A, A#, B are lower than C in standard MIDI numbering
    keyNumber = keyNumber + 12 + ((octave - 1) * 12) + 1;
  } else {
    keyNumber = keyNumber + ((octave - 1) * 12) + 1;
  }
  // MIDI note number to frequency: A4 = 69 = 440Hz
  return 440 * Math.pow(2, (keyNumber - 69) / 12);
};


export const getScaleIntervals = (scaleType: "major" | "minor" | "minorPentatonic" | "majorPentatonic"): number[] => {
  switch (scaleType) {
    case "major":
      return [0, 2, 4, 5, 7, 9, 11]; // W-W-H-W-W-W-H
    case "minor":
      return [0, 2, 3, 5, 7, 8, 10]; // W-H-W-W-H-W-W (Natural Minor)
    case "minorPentatonic":
      return [0, 3, 5, 7, 10];
    case "majorPentatonic":
      return [0, 2, 4, 7, 9];
    default:
      return [0, 2, 4, 5, 7, 9, 11]; // Default to major
  }
};

export const getScaleNotes = (
  rootNote: string, // e.g. "C"
  scaleType: "major" | "minor" | "minorPentatonic" | "majorPentatonic",
  octave: number // e.g. 3 or 4
): string[] => {
  const rootIndex = NOTE_NAMES.indexOf(rootNote);
  if (rootIndex === -1) throw new Error(`Invalid root note: ${rootNote}`);

  const intervals = getScaleIntervals(scaleType);
  return intervals.map(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    const currentOctave = octave + Math.floor((rootIndex + interval) / 12);
    return `${NOTE_NAMES[noteIndex]}${currentOctave}`;
  });
};


export function getRandomElement<T,>(arr: T[]): T {
  if (!arr || arr.length === 0) {
    // Fallback for safety, though ideally this shouldn't be hit if data is structured correctly
    console.warn("getRandomElement called with empty or undefined array");
    return undefined as any; 
  }
  return arr[Math.floor(Math.random() * arr.length)];
}

// Drum patterns: Each instrument now has an array of 1-bar (16 steps) pattern variations.
export const drumPatterns = {
  classicLoFi: {
    kick: [
      [1,0,0,0,1,0,0,1,0,0,1,0,0,0,0,0],
      [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
      [1,0,0,1,0,0,1,0,1,0,0,0,0,0,1,0],
      [1,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
    ],
    snare: [
      [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      [0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0], // Added ghost note
      [0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0], // Snare on 2 and 4 (variant)
      [0,0,0,0,1,0,0,0,0,1,0,0,1,0,0,0], // Snare with offbeat
    ],
    hihat: [
      [1,0,1,0,1,1,1,0,1,0,1,0,1,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Straight 16ths
      [1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,1], // More sparse/syncopated
      [0,1,1,0,1,1,0,1,0,1,1,0,1,1,0,1], // Offbeat focused
    ],
    openHihat: [
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0], // Earlier open hihat
      [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0], // Different placement
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // No open hihat (variation)
    ],
  },
  dustyBreaks: {
    kick: [
      [1,0,0,1,0,0,1,0,0,1,0,0,1,0,1,0],
      [1,0,1,0,1,0,0,0,1,0,0,1,0,0,1,0],
      [1,0,0,0,1,0,1,0,1,0,0,0,0,1,0,0],
      [1,0,0,1,0,1,0,0,1,0,1,0,0,0,1,0],
    ],
    snare: [
      [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1], // Original + end snare
      [0,0,0,0,1,0,0,1,0,0,0,0,1,0,1,0], // More syncopated snare
      [0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,1],
      [0,0,0,0,1,0,1,0,0,0,0,0,1,0,0,0], // Snare with ghost
    ],
    hihat: [
      [1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1],
      [1,1,1,1,1,1,1,1,1,0,1,1,1,0,1,1], // Slightly different groove
      [0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1], // Straight 8ths (as 16ths)
      [1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0], // Variation with small gaps
    ],
    openHihat: [
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
      [0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0], // Earlier open hihat
      [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // No open hihat (variation)
    ],
  },
  minimal808: {
    kick: [
      [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      [1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], // More kicks
      [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0],
      [1,0,1,0,0,0,0,0,1,0,1,0,0,0,0,0], // Trap-like busy kick
    ],
    snare: [
      [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      [0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0], // Standard clap on 4
      [0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0], // Offbeat snare/clap
      [0,0,0,0,1,0,0,0,0,0,1,0,1,0,0,0], // 808 snare roll feel
    ],
    hihat: [ // 808 hihats are often busier
      [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
      [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0], // Straight 8ths
      [1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1], // Busy 16ths
      [1,1,1,1,0,0,1,1,1,1,1,1,0,0,1,1], // Gaps and rolls
    ],
    openHihat: [ // Typically less frequent in minimal 808, but can be used
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0], // Occasional open hat
      [0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0], // Different placement for variety
    ],
  }
};

// For simplicity, bass/melody/chord patterns will be more abstractly generated
// in AudioEngine based on style and scale.
