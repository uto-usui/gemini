
import { LoopConfig, NoteEvent, Complexity, InstrumentType, BassOscillatorType, BassTimbreParameters } from '../types';
import { STEPS_PER_BAR, TOTAL_BARS, TOTAL_STEPS } from '../constants';
import { noteToFrequency, getScaleNotes, drumPatterns, getRandomElement } from '../utils/musicUtils';

export default class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private lowPassFilter: BiquadFilterNode | null = null;
  private distortionNode: WaveShaperNode | null = null;
  private vinylCrackleNode: AudioBufferSourceNode | null = null;
  private vinylCrackleGain: GainNode | null = null;
  private pitchWobbleLFO: OscillatorNode | null = null;
  private pitchWobbleLfoGain: GainNode | null = null;
  
  private schedulerIntervalId: number | null = null;
  private currentStep: number = 0;
  private nextStepAudioContextTime: number = 0; 
  private tempo: number = 120;
  private stepDurationSec: number = (60.0 / 120) / (STEPS_PER_BAR / 4); // Initial default
  private isPlaying: boolean = false;
  private noteSequence: NoteEvent[] = [];
  private lookaheadTimeMs: number = 25; 
  private scheduleAheadTimeSec: number = 0.1;

  private generalSynthOscillators: Map<string, OscillatorNode[]> = new Map();
  
  private instrumentGains: Map<InstrumentType, GainNode> = new Map();
  private instrumentMuteStates: Map<InstrumentType, boolean> = new Map([
    ['kick', false], ['snare', false], ['hihat', false], ['openHihat', false], ['bass', false]
  ]);

  private bassParams: BassTimbreParameters = {
    oscillatorType: 'sine',
    filterCutoff: 3560,
    filterQ: 3,
    gain: 0.77,
  };
  private activeBassLPFNodes: Set<BiquadFilterNode> = new Set();

  private onStepChangeCallback: ((step: number) => void) | null = null;
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.setupMasterBus();
    }
  }

  private setupMasterBus() {
    if (!this.audioContext) return;
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.6; 

    this.lowPassFilter = this.audioContext.createBiquadFilter();
    this.lowPassFilter.type = "lowpass";
    this.lowPassFilter.frequency.value = 20000;

    this.distortionNode = this.audioContext.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
        const x = i * 2 / 255 - 1;
        curve[i] = (Math.PI + 15) * x / (Math.PI + 15 * Math.abs(x)); 
    }
    this.distortionNode.curve = curve;
    this.distortionNode.oversample = '4x';

    const instrumentTypes: InstrumentType[] = ['kick', 'snare', 'hihat', 'openHihat', 'bass'];
    instrumentTypes.forEach(type => {
        const gainNode = this.audioContext!.createGain();
        gainNode.gain.value = (type === 'bass' ? this.bassParams.gain : 1.0);
        gainNode.connect(this.masterGain);
        this.instrumentGains.set(type, gainNode);
    });

    this.masterGain.connect(this.lowPassFilter);
    this.lowPassFilter.connect(this.distortionNode);
    this.distortionNode.connect(this.audioContext.destination);

    this.setupVinylCrackle();
    this.setupPitchWobbleLFO();
  }

  private setupVinylCrackle() {
    if (!this.audioContext || !this.masterGain) return;
    this.vinylCrackleGain = this.audioContext.createGain();
    this.vinylCrackleGain.gain.value = 0; 
    this.vinylCrackleGain.connect(this.masterGain); 

    const bufferSize = 2 * this.audioContext.sampleRate;
    const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11; 
        b6 = white * 0.115926;
    }
    this.vinylCrackleNode = this.audioContext.createBufferSource();
    this.vinylCrackleNode.buffer = noiseBuffer;
    this.vinylCrackleNode.loop = true;
    this.vinylCrackleNode.connect(this.vinylCrackleGain);
    this.vinylCrackleNode.start();
  }
  
  private setupPitchWobbleLFO() {
    if (!this.audioContext) return;
    this.pitchWobbleLFO = this.audioContext.createOscillator();
    this.pitchWobbleLfoGain = this.audioContext.createGain();
    this.pitchWobbleLFO.type = 'sine';
    this.pitchWobbleLFO.frequency.value = 0.5; 
    this.pitchWobbleLfoGain.gain.value = 4; 
    this.pitchWobbleLFO.connect(this.pitchWobbleLfoGain);
    this.pitchWobbleLFO.start();
  }

  public setOnStepChangeCallback(callback: (step: number) => void) {
    this.onStepChangeCallback = callback;
  }

  public getNoteSequence(): NoteEvent[] {
    return this.noteSequence;
  }

  public getStepDurationSec(): number {
    return this.stepDurationSec;
  }

  private applyLofiConfig(config: LoopConfig['lofiConfig']) {
    if (!this.audioContext || !this.lowPassFilter || !this.distortionNode || !this.vinylCrackleGain || !this.pitchWobbleLFO || !this.pitchWobbleLfoGain) return;
    
    this.lowPassFilter.frequency.setTargetAtTime(config.masterFilterCutoff, this.audioContext.currentTime, 0.01);
    this.vinylCrackleGain.gain.setTargetAtTime(config.vinylCrackleLevel, this.audioContext.currentTime, 0.01);
    this.pitchWobbleLFO.frequency.setTargetAtTime(config.pitchWobbleRate, this.audioContext.currentTime, 0.01);
    this.pitchWobbleLfoGain.gain.setTargetAtTime(config.pitchWobbleDepth, this.audioContext.currentTime, 0.01);
  }
  
  private addOscillatorToGeneralWobble(id: string, osc: OscillatorNode) {
    if (!this.generalSynthOscillators.has(id)) {
        this.generalSynthOscillators.set(id, []);
    }
    this.generalSynthOscillators.get(id)?.push(osc);
    if (this.pitchWobbleLfoGain && osc.detune) {
        this.pitchWobbleLfoGain.connect(osc.detune);
    }
  }

  private removeOscillatorFromGeneralWobble(id: string, osc: OscillatorNode) {
    if (this.pitchWobbleLfoGain && osc.detune) {
      try {
        if (osc.context && osc.context.currentTime !== undefined && osc.detune && typeof osc.detune.value === 'number') { 
             this.pitchWobbleLfoGain.disconnect(osc.detune);
        }
      } catch (e) { /* console.warn("Error disconnecting LFO from specific osc.detune onended:", e); */ }
    }

    const oscs = this.generalSynthOscillators.get(id);
    if (oscs) {
        const index = oscs.indexOf(osc);
        if (index > -1) {
            oscs.splice(index, 1);
        }
        if (oscs.length === 0) {
            this.generalSynthOscillators.delete(id);
        }
    }
  }

  public setInstrumentMute(instrument: InstrumentType, isMuted: boolean) {
    this.instrumentMuteStates.set(instrument, isMuted);
    const gainNode = this.instrumentGains.get(instrument);
    if (gainNode && this.audioContext) {
      const targetGain = isMuted ? 0 : (instrument === 'bass' ? this.bassParams.gain : 1.0);
      gainNode.gain.setTargetAtTime(targetGain, this.audioContext.currentTime, 0.01);
    }
  }

  public getInstrumentMuteStates(): Map<InstrumentType, boolean> {
    return new Map(this.instrumentMuteStates);
  }
  
  public getBassParameters(): BassTimbreParameters {
    return { ...this.bassParams };
  }

  public setBassParameter(param: keyof BassTimbreParameters, value: string | number) {
    if (!this.audioContext) return;

    if (param === 'oscillatorType' && typeof value === 'string') {
      this.bassParams.oscillatorType = value as BassOscillatorType;
    } else if (param === 'filterCutoff' && typeof value === 'number') {
      this.bassParams.filterCutoff = value;
      this.activeBassLPFNodes.forEach(lpf => {
        lpf.frequency.setTargetAtTime(value, this.audioContext!.currentTime, 0.01);
      });
    } else if (param === 'filterQ' && typeof value === 'number') {
      this.bassParams.filterQ = value;
      this.activeBassLPFNodes.forEach(lpf => {
        lpf.Q.setTargetAtTime(value, this.audioContext!.currentTime, 0.01);
      });
    } else if (param === 'gain' && typeof value === 'number') {
      this.bassParams.gain = value;
      const bassGainNode = this.instrumentGains.get('bass');
      if (bassGainNode && !this.instrumentMuteStates.get('bass')) {
        bassGainNode.gain.setTargetAtTime(value, this.audioContext.currentTime, 0.01);
      }
    }
  }

  public generateAndPlayLoop(config: LoopConfig) {
    if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.setupMasterBus(); 
    }
     if (!this.audioContext) return; 

    this.audioContext.resume(); 
    this.stop(true); 

    this.instrumentMuteStates.forEach((_, key) => this.instrumentMuteStates.set(key, false));
    this.bassParams = { 
        oscillatorType: 'sine', 
        filterCutoff: 3560, 
        filterQ: 3, 
        gain: 0.77 
    };
    this.instrumentGains.forEach((gainNode, type) => {
        const targetGain = this.instrumentMuteStates.get(type) ? 0 : (type === 'bass' ? this.bassParams.gain : 1.0);
        gainNode.gain.value = targetGain;
    });
    this.activeBassLPFNodes.clear();

    this.tempo = config.tempo;
    this.stepDurationSec = (60.0 / this.tempo) / (STEPS_PER_BAR / 4);
    this.applyLofiConfig(config.lofiConfig);
    this.noteSequence = this.generateSequence(config);
    
    this.currentStep = 0; 
    this.isPlaying = true;
    this.startScheduler();
  }

  public stop(immediate = false) {
    this.isPlaying = false;
    if (this.schedulerIntervalId !== null) {
      clearInterval(this.schedulerIntervalId);
      this.schedulerIntervalId = null;
    }
    this.activeBassLPFNodes.clear();

    this.generalSynthOscillators.forEach(oscs => {
        oscs.forEach(osc => {
            if (this.pitchWobbleLfoGain && osc.detune) {
                try {
                    if (osc.context && osc.context.currentTime !== undefined && osc.detune && typeof osc.detune.value === 'number') {
                         this.pitchWobbleLfoGain.disconnect(osc.detune);
                    }
                } catch (e) { /* console.warn("Error disconnecting LFO during stop:", e); */ }
            }
            try {
                osc.stop(immediate && this.audioContext ? this.audioContext.currentTime : 0);
            } catch(e) { /* already stopped or invalid state */ }
        });
    });
    this.generalSynthOscillators.clear(); 
  }
  
  public togglePlayPause(): boolean {
    if (!this.audioContext) return false;
    if (this.noteSequence.length === 0) return false; 

    if (this.isPlaying) { 
      this.audioContext.suspend();
      this.isPlaying = false;
      if (this.schedulerIntervalId !== null) {
        clearInterval(this.schedulerIntervalId);
        this.schedulerIntervalId = null;
      }
    } else { 
      this.audioContext.resume();
      this.isPlaying = true;
      this.startScheduler();
    }
    if (this.onStepChangeCallback) { 
        this.onStepChangeCallback(this.currentStep);
    }
    return this.isPlaying;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private startScheduler() {
    if (this.schedulerIntervalId !== null) {
      clearInterval(this.schedulerIntervalId);
    }
    if (!this.audioContext || !this.masterGain) return; 

    this.nextStepAudioContextTime = this.audioContext.currentTime;
    this.schedulerIntervalId = window.setInterval(() => this.scheduler(), this.lookaheadTimeMs);
  }
  
  private scheduler() {
    if (!this.audioContext) return;

    // stepDurationSec is now a member variable, updated with tempo.
    while (this.nextStepAudioContextTime < this.audioContext.currentTime + this.scheduleAheadTimeSec) {
        if (this.isPlaying) { 
            const beatInLoop = (this.currentStep % TOTAL_STEPS) * (1 / (STEPS_PER_BAR / 4));
            
            this.noteSequence.forEach(noteEvent => {
                if (Math.abs(noteEvent.time - beatInLoop) < 0.001 * (STEPS_PER_BAR / 4)) { 
                     this.playNoteEvent(noteEvent, this.nextStepAudioContextTime);
                }
            });
        }
        
        if (this.onStepChangeCallback) {
            this.onStepChangeCallback(this.currentStep % TOTAL_STEPS);
        }

        this.currentStep = (this.currentStep + 1); 
        if (this.currentStep >= TOTAL_STEPS && this.isPlaying) { 
             this.currentStep = 0;
        }
        this.nextStepAudioContextTime += this.stepDurationSec;
    }
  }

  private playNoteEvent(noteEvent: NoteEvent, time: number) {
    if (!this.audioContext || !this.masterGain) return;

    const { instrument, pitch, duration, velocity } = noteEvent;
    // stepDurationSec is now a member variable
    const noteDurationSec = duration * this.stepDurationSec; 

    const instrumentId = `${instrument}-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;
    const instrumentGainNode = this.instrumentGains.get(instrument);
    if (!instrumentGainNode) return;


    switch (instrument) {
      case "kick":
        const kickOsc = this.audioContext.createOscillator();
        const kickGain = this.audioContext.createGain();
        kickOsc.type = "sine";
        kickOsc.frequency.setValueAtTime(150, time);
        kickOsc.frequency.exponentialRampToValueAtTime(50, time + 0.05);
        kickGain.gain.setValueAtTime(velocity, time);
        kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
        kickOsc.connect(kickGain);
        kickGain.connect(instrumentGainNode);
        kickOsc.start(time);
        kickOsc.stop(time + 0.2);
        break;

      case "snare":
        const noise = this.audioContext.createBufferSource();
        const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.2, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBuffer.length; i++) output[i] = Math.random() * 2 - 1;
        noise.buffer = noiseBuffer;
        
        const noiseFilter = this.audioContext.createBiquadFilter();
        noiseFilter.type = "highpass";
        noiseFilter.frequency.value = 900;
        noise.connect(noiseFilter);

        const snareLPCutFilter = this.audioContext.createBiquadFilter();
        snareLPCutFilter.type = "lowpass";
        snareLPCutFilter.frequency.value = 10000; 
        noiseFilter.connect(snareLPCutFilter);

        const snareGain = this.audioContext.createGain();
        snareGain.gain.setValueAtTime(velocity * 0.8, time);
        snareGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
        snareLPCutFilter.connect(snareGain);
        snareGain.connect(instrumentGainNode);
        noise.start(time);
        noise.stop(time + 0.15);
        break;

      case "hihat":
      case "openHihat":
        const hihatNoise = this.audioContext.createBufferSource();
        const hihatBufferLen = instrument === "hihat" ? 0.05 : 0.3;
        const hihatBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * hihatBufferLen, this.audioContext.sampleRate);
        const hihatOutput = hihatBuffer.getChannelData(0);
        for (let i = 0; i < hihatBuffer.length; i++) hihatOutput[i] = Math.random() * 2 - 1;
        hihatNoise.buffer = hihatBuffer;

        const hihatFilter = this.audioContext.createBiquadFilter();
        hihatFilter.type = "highpass";
        hihatFilter.frequency.value = 4500; 
        hihatNoise.connect(hihatFilter);

        const hihatLPCutFilter = this.audioContext.createBiquadFilter();
        hihatLPCutFilter.type = "lowpass";
        hihatLPCutFilter.frequency.value = 12000; 
        hihatFilter.connect(hihatLPCutFilter);
        
        const hihatGain = this.audioContext.createGain();
        hihatGain.gain.setValueAtTime(velocity * 0.5, time);
        hihatGain.gain.exponentialRampToValueAtTime(0.001, time + hihatBufferLen);
        hihatLPCutFilter.connect(hihatGain);
        hihatGain.connect(instrumentGainNode);
        hihatNoise.start(time);
        hihatNoise.stop(time + hihatBufferLen);
        break;
      
      case "bass":
        const bassOsc = this.audioContext.createOscillator();
        const bassNoteEnvelopeGain = this.audioContext.createGain();
        const bassLPF = this.audioContext.createBiquadFilter();

        bassOsc.type = this.bassParams.oscillatorType; 
        if (typeof pitch === 'string') bassOsc.frequency.setValueAtTime(noteToFrequency(pitch), time);
        else if (typeof pitch === 'number') bassOsc.frequency.setValueAtTime(pitch, time);

        bassLPF.type = "lowpass";
        bassLPF.frequency.setValueAtTime(this.bassParams.filterCutoff, time); 
        bassLPF.Q.setValueAtTime(this.bassParams.filterQ, time); 
        this.activeBassLPFNodes.add(bassLPF);

        const bassAttack = 0.01; 
        const bassRelease = 0.1; 
        const bassPeakLevel = velocity; 
        
        bassNoteEnvelopeGain.gain.setValueAtTime(0, time);
        bassNoteEnvelopeGain.gain.linearRampToValueAtTime(bassPeakLevel, time + bassAttack);

        const scheduledBassReleaseStartTime = time + noteDurationSec - bassRelease;
        if (scheduledBassReleaseStartTime > time + bassAttack) {
            bassNoteEnvelopeGain.gain.setValueAtTime(bassPeakLevel, scheduledBassReleaseStartTime);
        }
        bassNoteEnvelopeGain.gain.linearRampToValueAtTime(0.0001, time + noteDurationSec);

        bassOsc.connect(bassLPF);
        bassLPF.connect(bassNoteEnvelopeGain);
        bassNoteEnvelopeGain.connect(instrumentGainNode);

        bassOsc.start(time);
        bassOsc.stop(time + noteDurationSec + 0.05); 
        this.addOscillatorToGeneralWobble(instrumentId, bassOsc);
        
        bassOsc.onended = () => {
            this.removeOscillatorFromGeneralWobble(instrumentId, bassOsc);
            this.activeBassLPFNodes.delete(bassLPF);
            try { bassLPF.disconnect(); } catch (e) {/* Already disconnected */}
            try { bassNoteEnvelopeGain.disconnect(); } catch (e) {/* Already disconnected */}
        };
        break;
    
    default:
        break;
    }
  }

  private generateSequence(config: LoopConfig): NoteEvent[] {
    const sequence: NoteEvent[] = [];
    if (!config || !config.key || !config.scaleType || !config.complexity || !config.tempo) {
        console.error("Invalid config for generateSequence", config);
        return [];
    }

    const scaleNotesOctave2 = getScaleNotes(config.key, config.scaleType, 2); 
    const beatsPerBar = STEPS_PER_BAR / 4; 
    // stepDurationSec is now a member variable
    // const stepDuration = 60.0 / config.tempo / (STEPS_PER_BAR / 4); 

    const selectedDrumStyle = drumPatterns[config.drumKitStyle] || drumPatterns.classicLoFi;
    for (let bar = 0; bar < TOTAL_BARS; bar++) {
        const kickPatternForBar = getRandomElement(selectedDrumStyle.kick);
        const snarePatternForBar = getRandomElement(selectedDrumStyle.snare);
        const hihatPatternForBar = getRandomElement(selectedDrumStyle.hihat);
        const openHihatPatternForBar = getRandomElement(selectedDrumStyle.openHihat);

        for (let stepInBar = 0; stepInBar < STEPS_PER_BAR; stepInBar++) {
            const time = bar * beatsPerBar + (stepInBar / (STEPS_PER_BAR / beatsPerBar));
            let baseDrumVelocity = 0.75 + Math.random() * 0.25; 
            
            if (kickPatternForBar && kickPatternForBar[stepInBar % kickPatternForBar.length] === 1) {
                if (Math.random() < (config.complexity === Complexity.SPARSE ? 0.7 : 1.0) ) { 
                    sequence.push({ time, pitch: "C1", duration: 0.25, velocity: baseDrumVelocity * (0.95 + Math.random()*0.1), instrument: "kick" });
                }
            }
            if (snarePatternForBar && snarePatternForBar[stepInBar % snarePatternForBar.length] === 1) {
                 if (Math.random() < (config.complexity === Complexity.SPARSE ? 0.8 : 1.0) ) {
                    sequence.push({ time, pitch: "C2", duration: 0.25, velocity: baseDrumVelocity * (0.85 + Math.random()*0.1), instrument: "snare" });
                }
            }
            if (hihatPatternForBar && hihatPatternForBar[stepInBar % hihatPatternForBar.length] === 1) {
                let hihatProb = 1.0;
                if (config.complexity === Complexity.SPARSE) hihatProb = 0.5;
                else if (config.complexity === Complexity.COMPLEX && Math.random() < 0.25) { 
                     sequence.push({ time: time + (this.stepDurationSec / 2 / (beatsPerBar/STEPS_PER_BAR) ), pitch: "F#2", duration: 0.06, velocity: baseDrumVelocity * (0.4 + Math.random()*0.1), instrument: "hihat" });
                }
                if (Math.random() < hihatProb) {
                    sequence.push({ time, pitch: "F#2", duration: 0.125, velocity: baseDrumVelocity * (0.6 + Math.random()*0.15), instrument: "hihat" });
                }
            }
            if (openHihatPatternForBar && openHihatPatternForBar[stepInBar % openHihatPatternForBar.length] === 1) {
                 if (Math.random() < (config.complexity === Complexity.COMPLEX ? 1.0 : 0.8) ) { 
                    sequence.push({ time, pitch: "A#2", duration: 0.5, velocity: baseDrumVelocity * (0.5 + Math.random()*0.15), instrument: "openHihat" });
                }
            }
        }
    }
    
    if (scaleNotesOctave2.length > 0) {
        let bassNoteCountTargetPerBar = 0;
        switch (config.complexity) {
            case Complexity.SPARSE: bassNoteCountTargetPerBar = config.bassStyle === 'simpleRootNotes' ? 1 : 2; break;
            case Complexity.STANDARD: bassNoteCountTargetPerBar = config.bassStyle === 'simpleRootNotes' ? 2 : (config.bassStyle === 'walkingEighths' ? 4 : 3); break;
            case Complexity.COMPLEX: bassNoteCountTargetPerBar = config.bassStyle === 'simpleRootNotes' ? 3 : (config.bassStyle === 'walkingEighths' ? 5 : 4); break;
            default: bassNoteCountTargetPerBar = 2;
        }

        for (let bar = 0; bar < TOTAL_BARS; bar++) {
            let notesPlacedInBar = 0;
            const beatsInThisBar = bar === TOTAL_BARS -1 ? beatsPerBar -1 : beatsPerBar; 

            if (config.bassStyle === 'simpleRootNotes') {
                for (let beat = 0; beat < beatsInThisBar && notesPlacedInBar < bassNoteCountTargetPerBar; beat++) {
                    if (beat === 0 || (beat === 2 && Math.random() < 0.7 / (config.complexity === Complexity.SPARSE ? 2 : 1) )) { 
                        sequence.push({ time: bar * beatsPerBar + beat, pitch: scaleNotesOctave2[0], duration: 0.9, velocity: 0.55 + Math.random() * 0.2, instrument: "bass" });
                        notesPlacedInBar++;
                    } else if (config.complexity !== Complexity.SPARSE && Math.random() < 0.25 * (config.complexity === Complexity.COMPLEX ? 2 : 1) && notesPlacedInBar < bassNoteCountTargetPerBar) {
                        sequence.push({ time: bar * beatsPerBar + beat + (Math.random() < 0.5 ? 0.5 : 0.25) , pitch: scaleNotesOctave2[1 % scaleNotesOctave2.length], duration: 0.4, velocity: (0.55 + Math.random() * 0.2)*0.8, instrument: "bass"});
                        notesPlacedInBar++;
                    }
                }
            } else if (config.bassStyle === 'walkingEighths') {
                for (let beat = 0; beat < beatsInThisBar * 2 && notesPlacedInBar < bassNoteCountTargetPerBar * 1.5; beat++) { 
                    if (Math.random() < 0.7 || (beat % 2 === 0 && config.complexity !== Complexity.SPARSE)) { 
                         if(notesPlacedInBar < bassNoteCountTargetPerBar * 1.5){
                            sequence.push({ time: bar * beatsPerBar + beat * 0.5, pitch: getRandomElement(scaleNotesOctave2), duration: 0.45, velocity: (0.55 + Math.random() * 0.2) * (0.85 + Math.random()*0.1), instrument: "bass" });
                            notesPlacedInBar++;
                         }
                    }
                }
            } else if (config.bassStyle === 'syncopatedFunk') {
                 for (let beat = 0; beat < beatsInThisBar * 2 && notesPlacedInBar < bassNoteCountTargetPerBar * 1.5; beat++) { 
                    let placementProbability = 0.3;
                    if (config.complexity === Complexity.STANDARD) placementProbability = 0.45;
                    if (config.complexity === Complexity.COMPLEX) placementProbability = 0.6;

                    if (Math.random() < placementProbability) {
                        const timeOffset = beat * 0.5;
                        if (bar * beatsPerBar + timeOffset < TOTAL_BARS * beatsPerBar) {
                             if(notesPlacedInBar < bassNoteCountTargetPerBar * 1.5){
                                sequence.push({ time: bar * beatsPerBar + timeOffset, pitch: getRandomElement(scaleNotesOctave2), duration: Math.random() * 0.3 + 0.15, velocity: 0.55 + Math.random() * 0.2, instrument: "bass" });
                                notesPlacedInBar++;
                             }
                        }
                    }
                 }
            }
             if (notesPlacedInBar === 0 && bar < TOTAL_BARS -1) { 
                 sequence.push({ time: bar * beatsPerBar, pitch: scaleNotesOctave2[0], duration: 1, velocity: 0.6, instrument: "bass" });
            }
        }
    }
    
    sequence.sort((a, b) => a.time - b.time);
    return sequence.filter(note => note.time < TOTAL_BARS * beatsPerBar);
  }
}
