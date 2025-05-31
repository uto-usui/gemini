
import React, { useEffect, useRef, useMemo } from 'react';
import { NoteEvent, VisualizerInstrumentType } from '../types';

interface PatternVisualizerProps {
  noteSequence: NoteEvent[];
  currentStep: number; // This is the precise step from AudioEngine
  isPlaying: boolean;
  totalSteps: number;
  stepsPerBar: number;
  instruments: VisualizerInstrumentType[];
  stepDurationSec: number; // Duration of one 16th note step in seconds
}

const INSTRUMENT_ROW_HEIGHT = 40; 
const STEP_WIDTH = 20; 
const PLAYHEAD_COLOR = 'rgba(0, 255, 255, 0.7)'; 
const GRID_LINE_COLOR = 'rgba(255, 255, 255, 0.1)';
const BAR_LINE_COLOR = 'rgba(255, 255, 255, 0.3)';
const NOTE_BACKGROUND_COLOR = 'rgba(255, 255, 255, 0.05)';

const INSTRUMENT_COLORS: Record<VisualizerInstrumentType, string> = {
  kick: 'rgba(255, 68, 68, 0.9)',      
  snare: 'rgba(255, 170, 68, 0.9)',     
  hihat: 'rgba(68, 170, 255, 0.9)',     
  openHihat: 'rgba(68, 221, 221, 0.9)', 
  bass: 'rgba(170, 68, 255, 0.9)',      
};
const ACTIVE_NOTE_BORDER_COLOR = 'rgba(255, 255, 0, 1)'; // Yellow

// Helper hook to get the previous value of a prop or state
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  }); // Runs after every render and updates ref.current
  return ref.current; // Returns the value from the PREVIOUS render
}

const PatternVisualizer: React.FC<PatternVisualizerProps> = ({
  noteSequence,
  currentStep: audioEngineStep, 
  isPlaying,
  totalSteps,
  stepsPerBar,
  instruments,
  stepDurationSec,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const instrumentLabelWidth = 100; 

  const lastStepUpdateTimeRef = useRef<number>(performance.now());
  // visualPlayheadStepRef is for smooth visual interpolation between discrete audioEngineSteps
  const visualPlayheadStepRef = useRef<number>(audioEngineStep); 
  const prevAudioEngineStepForVisualInterpolationRef = useRef<number>(audioEngineStep);

  const preparedNotes = useMemo(() => {
    return noteSequence.map((note, index) => {
      const startStep = Math.floor(note.time * (stepsPerBar / 4));
      let durationSteps = Math.max(1, Math.floor(note.duration * (stepsPerBar / 4)));
      return {
        id: `note-${index}-${note.instrument}-${startStep}`,
        instrument: note.instrument,
        startStep,
        durationSteps,
        velocity: note.velocity,
      };
    });
  }, [noteSequence, stepsPerBar]);

  // Update refs for visual interpolation when the discrete audioEngineStep changes
  useEffect(() => {
    if (audioEngineStep !== prevAudioEngineStepForVisualInterpolationRef.current) {
      lastStepUpdateTimeRef.current = performance.now();
      prevAudioEngineStepForVisualInterpolationRef.current = audioEngineStep;
      if (!isPlaying) { // If paused, snap visual playhead immediately
        visualPlayheadStepRef.current = audioEngineStep % totalSteps;
      }
    }
  }, [audioEngineStep, isPlaying, totalSteps]);


  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = totalSteps * STEP_WIDTH;
    const canvasHeight = instruments.length * INSTRUMENT_ROW_HEIGHT;

    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    ctx.scale(dpr, dpr);

    const draw = (interpolatedStep: number) => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      instruments.forEach((_, i) => {
        ctx.fillStyle = NOTE_BACKGROUND_COLOR;
        ctx.fillRect(0, i * INSTRUMENT_ROW_HEIGHT, canvasWidth, INSTRUMENT_ROW_HEIGHT);
      });
      
      ctx.strokeStyle = GRID_LINE_COLOR;
      ctx.lineWidth = 1;
      for (let i = 0; i <= totalSteps; i++) {
        if (i % stepsPerBar === 0) {
          ctx.strokeStyle = BAR_LINE_COLOR;
          ctx.lineWidth = 1.5;
        } else {
          ctx.strokeStyle = GRID_LINE_COLOR;
          ctx.lineWidth = 0.5;
        }
        ctx.beginPath();
        ctx.moveTo(i * STEP_WIDTH, 0);
        ctx.lineTo(i * STEP_WIDTH, canvasHeight);
        ctx.stroke();
      }
      for (let i = 0; i <= instruments.length; i++) {
        ctx.strokeStyle = BAR_LINE_COLOR; 
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, i * INSTRUMENT_ROW_HEIGHT);
        ctx.lineTo(canvasWidth, i * INSTRUMENT_ROW_HEIGHT);
        ctx.stroke();
      }

      const currentAudioStepForHighlight = audioEngineStep % totalSteps;

      preparedNotes.forEach(note => {
        const instrumentIndex = instruments.indexOf(note.instrument);
        if (instrumentIndex === -1) return;

        const x = note.startStep * STEP_WIDTH;
        const y = instrumentIndex * INSTRUMENT_ROW_HEIGHT;
        const noteHeight = INSTRUMENT_ROW_HEIGHT * 0.8;
        const yOffset = (INSTRUMENT_ROW_HEIGHT - noteHeight) / 2;

        const isActive = isPlaying &&
                         currentAudioStepForHighlight >= note.startStep &&
                         currentAudioStepForHighlight < (note.startStep + note.durationSteps);
        
        ctx.fillStyle = INSTRUMENT_COLORS[note.instrument];
        if (isActive) {
          ctx.globalAlpha = 0.85 + note.velocity * 0.15; 
        } else {
          ctx.globalAlpha = 0.5 + note.velocity * 0.3; 
        }

        if (note.instrument === 'bass') {
          const noteWidth = note.durationSteps * STEP_WIDTH - 2; 
          ctx.fillRect(x + 1, y + yOffset, noteWidth, noteHeight);
        } else { 
          const drumNoteWidth = STEP_WIDTH * 0.7;
          const xOffset = (STEP_WIDTH - drumNoteWidth) / 2;
          ctx.fillRect(x + xOffset, y + yOffset, drumNoteWidth, noteHeight);
        }
        ctx.globalAlpha = 1.0;

        if (isActive) {
            ctx.strokeStyle = ACTIVE_NOTE_BORDER_COLOR;
            ctx.lineWidth = 2;
            if (note.instrument === 'bass') {
                 ctx.strokeRect(x + 1, y + yOffset, note.durationSteps * STEP_WIDTH - 2, noteHeight);
            } else {
                 const drumNoteWidth = STEP_WIDTH * 0.7;
                 const xOffset = (STEP_WIDTH - drumNoteWidth) / 2;
                 ctx.strokeRect(x + xOffset, y + yOffset, drumNoteWidth, noteHeight);
            }
        }
      });

      if (isPlaying || interpolatedStep > 0 || interpolatedStep < totalSteps -1 ) {
        const playheadX = (interpolatedStep % totalSteps) * STEP_WIDTH;
        ctx.fillStyle = PLAYHEAD_COLOR;
        ctx.fillRect(playheadX - 1, 0, 2, canvasHeight);
      }
    };

    const animate = (timestamp: number) => {
      if (isPlaying && stepDurationSec > 0) {
        const timeSinceLastStepUpdate = timestamp - lastStepUpdateTimeRef.current;
        const stepProgressRatio = Math.min(1, Math.max(0, timeSinceLastStepUpdate / (stepDurationSec * 1000)));
        visualPlayheadStepRef.current = prevAudioEngineStepForVisualInterpolationRef.current + stepProgressRatio;
      } else if (!isPlaying) {
         visualPlayheadStepRef.current = audioEngineStep % totalSteps;
      }

      draw(visualPlayheadStepRef.current);
      animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    animationFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [preparedNotes, audioEngineStep, isPlaying, totalSteps, stepsPerBar, instruments, stepDurationSec]);

  const prevAudioEngineStepForScroll = usePrevious(audioEngineStep);

  // Auto-scroll logic for "page turning"
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;

    if (!container || !canvas || !isPlaying) return;

    const dpr = window.devicePixelRatio || 1;
    const totalCanvasWidthCss = canvas.width / dpr; // Total width of the canvas in CSS pixels

    const currentDiscretePlayheadStep = audioEngineStep % totalSteps;
    const playheadXCss = currentDiscretePlayheadStep * STEP_WIDTH;

    const currentScrollLeft = container.scrollLeft;
    const containerCssWidth = container.clientWidth;

    let newScrollLeft = currentScrollLeft;

    // Determine the previous discrete step for loop detection.
    // If prevAudioEngineStepForScroll is undefined (e.g., on first load), default to current step to avoid false positives.
    const previousStepValue = prevAudioEngineStepForScroll === undefined ? audioEngineStep : prevAudioEngineStepForScroll;
    const prevDiscreteStepForLoop = previousStepValue % totalSteps;

    // Priority 1: Handle loop to the beginning
    if (currentDiscretePlayheadStep < (stepsPerBar / 4) && // Current step is near the start (e.g., first beat)
        prevDiscreteStepForLoop > (totalSteps - stepsPerBar) && // Previous step was near the end
        currentDiscretePlayheadStep < prevDiscreteStepForLoop // Confirms a wrap-around from a higher step to a lower one
       ) {
        newScrollLeft = 0; // Scrolled to the absolute beginning of the pattern
    }
    // Priority 2: Handle normal "page turns"
    else if (playheadXCss >= currentScrollLeft + containerCssWidth) { // Playhead is at or past the right edge
      newScrollLeft = currentScrollLeft + containerCssWidth;
    } else if (playheadXCss < currentScrollLeft) { // Playhead is at or past the left edge (e.g. user scrubbed back)
      newScrollLeft = currentScrollLeft - containerCssWidth;
    }

    // Clamp newScrollLeft to be within valid canvas bounds
    newScrollLeft = Math.max(0, newScrollLeft);
    newScrollLeft = Math.min(newScrollLeft, Math.max(0, totalCanvasWidthCss - containerCssWidth));

    if (newScrollLeft !== currentScrollLeft && Number.isFinite(newScrollLeft)) {
      container.scrollTo({
        left: newScrollLeft,
        behavior: 'auto', // Instant jump for "page turn"
      });
    }
  }, [audioEngineStep, prevAudioEngineStepForScroll, isPlaying, totalSteps, stepsPerBar, STEP_WIDTH]);


  return (
    <div className="w-full flex bg-neutral-800 rounded-lg shadow-inner overflow-hidden" style={{ height: `${instruments.length * INSTRUMENT_ROW_HEIGHT}px` }}>
      <div 
        className="bg-neutral-700/50 shrink-0 border-r border-neutral-600"
        style={{ width: `${instrumentLabelWidth}px` }}
      >
        {instruments.map((instrument) => (
          <div 
            key={instrument} 
            className="flex items-center justify-center text-xs text-neutral-300 font-medium select-none truncate px-1"
            style={{ 
              height: `${INSTRUMENT_ROW_HEIGHT}px`, 
              backgroundColor: `${INSTRUMENT_COLORS[instrument].replace('0.9', '0.2')}`
            }}
            title={instrument.charAt(0).toUpperCase() + instrument.slice(1)}
          >
            {instrument.charAt(0).toUpperCase() + instrument.slice(1)}
          </div>
        ))}
      </div>
      <div 
        ref={containerRef} 
        className="flex-grow overflow-x-auto overflow-y-hidden relative"
      >
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default PatternVisualizer;
