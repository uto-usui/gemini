
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Vibe, Complexity, LoopConfig, InstrumentType, BassOscillatorType, BassTimbreParameters, NoteEvent, VisualizerInstrumentType, VisualizerNote } from './types';
import { APP_TITLE, VIBE_OPTIONS, COMPLEXITY_OPTIONS, DEFAULT_API_KEY_WARNING, TOTAL_STEPS, STEPS_PER_BAR } from './constants';
import Button from './components/Button';
import SelectionCard from './components/SelectionCard';
import StepIndicator from './components/StepIndicator';
import AudioEngine from './services/AudioEngine';
import { fetchLoopConfig } from './services/GeminiService';
import { PlayIcon, PauseIcon, StopIcon, SparklesIcon, ChevronLeftIcon, LoadingSpinner } from './components/IconComponents';
import ToggleSwitch from './components/ToggleSwitch';
import Slider from './components/Slider';
import Select from './components/Select';
import PatternVisualizer from './components/PatternVisualizer';


const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedVibe, setSelectedVibe] = useState<Vibe | null>(null);
  const [selectedComplexity, setSelectedComplexity] = useState<Complexity | null>(null);
  const [loopConfig, setLoopConfig] = useState<LoopConfig | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState<boolean>(false);

  const audioEngineRef = useRef<AudioEngine | null>(null);

  const [instrumentMutes, setInstrumentMutes] = useState<Record<InstrumentType, boolean>>({
    kick: false, snare: false, hihat: false, openHihat: false, bass: false,
  });
  const [bassParams, setBassParams] = useState<BassTimbreParameters>({
    oscillatorType: 'sine', 
    filterCutoff: 3560, 
    filterQ: 3, 
    gain: 0.77,
  });

  const [visualizerCurrentStep, setVisualizerCurrentStep] = useState<number>(0);
  const [visualizerNoteSequence, setVisualizerNoteSequence] = useState<NoteEvent[]>([]);
  const [currentLoopStepDurationSec, setCurrentLoopStepDurationSec] = useState<number>(0.125); // Default, will be updated
  const VISUALIZER_INSTRUMENTS: VisualizerInstrumentType[] = ['kick', 'snare', 'hihat', 'openHihat', 'bass'];


  const BASS_OSC_OPTIONS: {value: BassOscillatorType, label: string}[] = [
    { value: 'sine', label: 'Sine' },
    { value: 'square', label: 'Square' },
    { value: 'sawtooth', label: 'Sawtooth' },
    { value: 'triangle', label: 'Triangle' },
  ];
  const INSTRUMENT_LABELS: Record<InstrumentType, string> = {
    kick: "Kick",
    snare: "Snare",
    hihat: "Hi-hat",
    openHihat: "Open Hi-hat",
    bass: "Bass"
  };

  const handleStepChangeForVisualizer = useCallback((step: number) => {
    setVisualizerCurrentStep(step);
  }, []);

  useEffect(() => {
    audioEngineRef.current = new AudioEngine();
    audioEngineRef.current.setOnStepChangeCallback(handleStepChangeForVisualizer);

    if (audioEngineRef.current) {
        const initialMutes = audioEngineRef.current.getInstrumentMuteStates();
        const mutesObject: Record<InstrumentType, boolean> = {} as Record<InstrumentType, boolean>;
        initialMutes.forEach((val, key) => { mutesObject[key] = val; });
        setInstrumentMutes(mutesObject);
        setBassParams(audioEngineRef.current.getBassParameters());
        setCurrentLoopStepDurationSec(audioEngineRef.current.getStepDurationSec());
    }

    if (!process.env.API_KEY) {
      setApiKeyMissing(true);
      setError(DEFAULT_API_KEY_WARNING);
    }
    return () => {
      audioEngineRef.current?.stop();
    };
  }, [handleStepChangeForVisualizer]);

  const handleVibeSelect = (vibe: Vibe) => {
    setSelectedVibe(vibe);
    setCurrentStep(2);
    setError(null);
  };

  const handleComplexitySelect = (complexity: Complexity) => {
    setSelectedComplexity(complexity);
    setCurrentStep(3);
    setError(null);
  };

  const initializeLiveControlsAndVisualizer = () => {
    if (audioEngineRef.current) {
        const initialMutes = audioEngineRef.current.getInstrumentMuteStates();
        const mutesObject: Record<InstrumentType, boolean> = {} as Record<InstrumentType, boolean>;
        initialMutes.forEach((val, key) => { mutesObject[key] = val; });
        setInstrumentMutes(mutesObject);
        setBassParams(audioEngineRef.current.getBassParameters());
        
        const sequence = audioEngineRef.current.getNoteSequence();
        setVisualizerNoteSequence(sequence || []);
        setVisualizerCurrentStep(0); 
        setCurrentLoopStepDurationSec(audioEngineRef.current.getStepDurationSec());
    }
  };
  
  const handleGenerateClick = useCallback(async () => {
    if (!selectedVibe || !selectedComplexity) return;

    setIsLoading(true);
    setError(null);
    setLoopConfig(null);
    setVisualizerNoteSequence([]); 

    if (audioEngineRef.current?.getIsPlaying()) {
        audioEngineRef.current?.stop();
    }
    setIsPlaying(false);

    try {
      const config = await fetchLoopConfig(selectedVibe, selectedComplexity); 
      setLoopConfig(config);
      audioEngineRef.current?.generateAndPlayLoop(config);
      setIsPlaying(true);
      initializeLiveControlsAndVisualizer();
    } catch (e: any) {
      console.error("Generation failed:", e);
      setError(`Failed to generate loop: ${e.message || 'Unknown error'}`);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [selectedVibe, selectedComplexity]);

  const handlePlayPauseToggle = () => {
    if (!loopConfig || !audioEngineRef.current) return;
    const playing = audioEngineRef.current.togglePlayPause();
    setIsPlaying(playing);
  };
  
  const handleStop = () => {
    audioEngineRef.current?.stop();
    setIsPlaying(false);
  }

  const handleBack = () => {
    if (isLoading) return;
    setError(null);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      if (currentStep === 2) setSelectedComplexity(null);
      if (currentStep === 3) {
        setLoopConfig(null);
        setVisualizerNoteSequence([]);
      }
      if (isPlaying) {
        handleStop();
      }
    }
  };
  
  const handleCreateNew = () => {
    handleStop();
    setCurrentStep(1);
    setSelectedVibe(null);
    setSelectedComplexity(null);
    setLoopConfig(null);
    setVisualizerNoteSequence([]);
    setVisualizerCurrentStep(0);
    setError(null);
    setIsLoading(false);
     if (audioEngineRef.current) {
        const defaultMutes = new Map<InstrumentType, boolean>([['kick', false], ['snare', false], ['hihat', false], ['openHihat', false], ['bass', false]]);
        const mutesObject: Record<InstrumentType, boolean> = {} as Record<InstrumentType, boolean>;
        defaultMutes.forEach((val, key) => { mutesObject[key] = val; });
        setInstrumentMutes(mutesObject);
        const defaultBassParams: BassTimbreParameters = { 
            oscillatorType: 'sine', 
            filterCutoff: 3560, 
            filterQ: 3, 
            gain: 0.77 
        };
        setBassParams(defaultBassParams);
        audioEngineRef.current.setBassParameter('oscillatorType', defaultBassParams.oscillatorType);
        audioEngineRef.current.setBassParameter('filterCutoff', defaultBassParams.filterCutoff);
        audioEngineRef.current.setBassParameter('filterQ', defaultBassParams.filterQ);
        audioEngineRef.current.setBassParameter('gain', defaultBassParams.gain);
        (Object.keys(instrumentMutes) as InstrumentType[]).forEach(instr => {
            audioEngineRef.current!.setInstrumentMute(instr, false);
        });
        setCurrentLoopStepDurationSec(audioEngineRef.current.getStepDurationSec()); // Reset step duration too
    }
  };

  const handleInstrumentMuteChange = (instrument: InstrumentType, isMuted: boolean) => {
    setInstrumentMutes(prev => ({ ...prev, [instrument]: isMuted }));
    audioEngineRef.current?.setInstrumentMute(instrument, isMuted);
  };

  const handleBassParamChange = (param: keyof BassTimbreParameters, value: string | number) => {
    setBassParams(prev => ({ ...prev, [param]: value }));
    audioEngineRef.current?.setBassParameter(param, value);
  };


  const renderStepContent = () => {
    switch (currentStep) {
      case 1: 
        return (
          <div className="space-y-4">
            {VIBE_OPTIONS.map((vibe) => (
              <SelectionCard
                key={vibe.id}
                item={vibe}
                isSelected={selectedVibe === vibe.id}
                onSelect={() => handleVibeSelect(vibe.id)}
              />
            ))}
          </div>
        );
      case 2: 
        return (
          <div className="space-y-4">
            {COMPLEXITY_OPTIONS.map((complexityOpt) => (
              <SelectionCard
                key={complexityOpt.id}
                item={complexityOpt}
                isSelected={selectedComplexity === complexityOpt.id}
                onSelect={() => handleComplexitySelect(complexityOpt.id)}
              />
            ))}
          </div>
        );
      case 3: 
        return (
          <div className="flex flex-col items-center space-y-6">
            {!loopConfig && !isLoading && (
                 <Button 
                    onClick={handleGenerateClick} 
                    disabled={isLoading || !selectedVibe || !selectedComplexity} 
                    size="lg"
                    variant="primary"
                    leftIcon={<SparklesIcon className="w-5 h-5"/>}
                >
                    Generate Loop
                </Button>
            )}
            {isLoading && (
              <div className="text-center p-8">
                <LoadingSpinner className="w-12 h-12 mx-auto text-sky-400" />
                <p className="mt-4 text-lg text-neutral-300">Crafting your lo-fi vibe...</p>
                <p className="text-sm text-neutral-500">This might take a moment.</p>
              </div>
            )}
            {loopConfig && !isLoading && (
              <>
                {visualizerNoteSequence.length > 0 && (
                    <PatternVisualizer
                        noteSequence={visualizerNoteSequence}
                        currentStep={visualizerCurrentStep}
                        isPlaying={isPlaying}
                        totalSteps={TOTAL_STEPS}
                        stepsPerBar={STEPS_PER_BAR}
                        instruments={VISUALIZER_INSTRUMENTS}
                        stepDurationSec={currentLoopStepDurationSec}
                    />
                )}
                <div className="flex space-x-4">
                  <Button 
                      onClick={handlePlayPauseToggle} 
                      size="lg"
                      variant={isPlaying ? "secondary" : "primary"}
                      leftIcon={isPlaying ? <PauseIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5"/>}
                  >
                      {isPlaying ? 'Pause' : 'Play'}
                  </Button>
                  <Button 
                      onClick={handleStop} 
                      size="lg"
                      variant="outline"
                      leftIcon={<StopIcon className="w-5 h-5"/>}
                  >
                      Stop
                  </Button>
                </div>

                <div className="w-full p-4 mt-6 bg-neutral-800/70 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-sky-400 mb-4 text-center">Live Controls</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                        {(Object.keys(instrumentMutes) as InstrumentType[]).map(instr => (
                            <ToggleSwitch
                                key={instr}
                                id={`mute-${instr}`}
                                label={INSTRUMENT_LABELS[instr]}
                                checked={!instrumentMutes[instr]}
                                onChange={(isChecked) => handleInstrumentMuteChange(instr, !isChecked)}
                            />
                        ))}
                    </div>

                    <h4 className="text-md font-semibold text-sky-300 mb-3 border-t border-neutral-700 pt-4">Bass Sound</h4>
                    <Select
                        id="bass-osc-type"
                        label="Oscillator Type"
                        options={BASS_OSC_OPTIONS}
                        value={bassParams.oscillatorType}
                        onChange={(val) => handleBassParamChange('oscillatorType', val)}
                    />
                    <Slider
                        id="bass-filter-cutoff"
                        label="Filter Cutoff"
                        min={100} max={5000} step={10}
                        value={bassParams.filterCutoff}
                        onChange={(val) => handleBassParamChange('filterCutoff', val)}
                        unit="Hz"
                    />
                    <Slider
                        id="bass-filter-q"
                        label="Filter Q"
                        min={0.1} max={20} step={0.1}
                        value={bassParams.filterQ}
                        onChange={(val) => handleBassParamChange('filterQ', val)}
                        unit="Q"
                    />
                    <Slider
                        id="bass-gain"
                        label="Overall Gain"
                        min={0} max={1.5} step={0.01}
                        value={bassParams.gain}
                        onChange={(val) => handleBassParamChange('gain', val)}
                    />
                </div>

                <Button onClick={handleCreateNew} variant="outline" size="sm" className="mt-8">Create New Vibe</Button>
              </>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <header className="text-center mb-6 sm:mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
          {APP_TITLE}
        </h1>
        <p className="mt-2 text-neutral-400 text-sm sm:text-base">
          Craft your 8-bar Drums & Bass lo-fi loop.
        </p>
      </header>

      <main className="w-full max-w-xl bg-neutral-800/50 backdrop-blur-md shadow-2xl rounded-2xl p-6 sm:p-10">
        <div className="flex items-center mb-8">
            {currentStep > 1 && !isLoading && (
                 <Button onClick={handleBack} variant="outline" size="sm" className="mr-4 !p-2 aspect-square" aria-label="Go back">
                    <ChevronLeftIcon className="w-5 h-5"/>
                 </Button>
            )}
            <StepIndicator currentStep={currentStep} totalSteps={3} />
        </div>
        
        {apiKeyMissing && currentStep === 1 && (
             <div className="mb-4 p-3 bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 rounded-md text-sm" role="alert">
                {DEFAULT_API_KEY_WARNING} Using fallback local generation.
             </div>
        )}
        {error && !apiKeyMissing && (
            <div className="mb-4 p-3 bg-red-500/20 text-red-300 border border-red-500/50 rounded-md text-sm" role="alert">
                {error}
            </div>
        )}

        {renderStepContent()}
      </main>

      <footer className="mt-8 text-center text-neutral-500 text-xs">
        <p>&copy; {new Date().getFullYear()} Lo-Fi Loop Generator. Drums & Bass edition.</p>
        <p>Music parameters assisted by Gemini API (if API key is available).</p>
      </footer>
    </div>
  );
};

export default App;
