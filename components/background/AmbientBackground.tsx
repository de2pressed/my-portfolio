"use client";

import { useEffect, useRef } from "react";

import { useMusicFrequency } from "@/hooks/useMusicFrequency";
import { useThemeColors } from "@/hooks/useThemeColors";

// Perlin noise implementation for organic variation
const permutation = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
const p = [...permutation, ...permutation];

function fade(t: number) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number) {
  return a + t * (b - a);
}

function grad(hash: number, x: number, y: number, z: number) {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

function perlinNoise(x: number, y: number, z: number) {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;

  x -= Math.floor(x);
  y -= Math.floor(y);
  z -= Math.floor(z);

  const u = fade(x);
  const v = fade(y);
  const w = fade(z);

  const A = p[X] + Y;
  const AA = p[A] + Z;
  const AB = p[A + 1] + Z;
  const B = p[X + 1] + Y;
  const BA = p[B] + Z;
  const BB = p[B + 1] + Z;

  return lerp(
    lerp(
      lerp(grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z), u),
      lerp(grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z), u),
      v
    ),
    lerp(
      lerp(grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1), u),
      lerp(grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1), u),
      v
    ),
    w
  );
}

// Envelope follower for attack/release simulation
class EnvelopeFollower {
  private value = 0;
  private attackTime = 0.01;
  private releaseTime = 0.3;
  private sampleRate = 60;

  constructor(attackTime = 0.01, releaseTime = 0.3, sampleRate = 60) {
    this.attackTime = attackTime;
    this.releaseTime = releaseTime;
    this.sampleRate = sampleRate;
  }

  process(input: number): number {
    const attackCoeff = Math.exp(-1 / (this.attackTime * this.sampleRate));
    const releaseCoeff = Math.exp(-1 / (this.releaseTime * this.sampleRate));
    const coeff = input > this.value ? attackCoeff : releaseCoeff;
    this.value = input + coeff * (this.value - input);
    return this.value;
  }

  reset() {
    this.value = 0;
  }
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3 ? normalized.split("").map((part) => `${part}${part}`).join("") : normalized;
  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

// Transient detector for beat sync
class TransientDetector {
  private previousValue = 0;
  private threshold = 0.3;
  private minTimeBetweenTransients = 0.1;
  private lastTransientTime = 0;

  constructor(threshold = 0.3, minTimeBetweenTransients = 0.1) {
    this.threshold = threshold;
    this.minTimeBetweenTransients = minTimeBetweenTransients;
  }

  process(value: number, currentTime: number): boolean {
    const delta = value - this.previousValue;
    this.previousValue = value;

    if (delta > this.threshold && currentTime - this.lastTransientTime > this.minTimeBetweenTransients) {
      this.lastTransientTime = currentTime;
      return true;
    }
    return false;
  }

  reset() {
    this.previousValue = 0;
    this.lastTransientTime = 0;
  }
}

export function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { energy, currentTime, duration, thumbnailColors, isPlaying } = useMusicFrequency();
  const { palette } = useThemeColors();
  const energyRef = useRef(energy);
  const paletteRef = useRef(palette);
  const thumbnailColorsRef = useRef(thumbnailColors);
  const songTimeRef = useRef(0);
  const durationRef = useRef(0);
  const songTimeUpdateRef = useRef(0);
  const isPlayingRef = useRef(isPlaying);
  const smoothedSignalsRef = useRef([0, 0, 0, 0]); // Stage 1 smoothing for 4 bands
  const smoothedSignalsStage2Ref = useRef([0, 0, 0, 0]); // Stage 2 smoothing for 4 bands
  const smoothedSignalsStage3Ref = useRef([0, 0, 0, 0]); // Stage 3 smoothing for 4 bands
  const peakHoldRef = useRef([0, 0, 0, 0]); // Peak hold values for 4 bands
  const peakHoldTimeRef = useRef([0, 0, 0, 0]); // Time since peak for 4 bands
  const smoothedPositionsRef = useRef([{x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}]); // Low-pass filtered positions
  const envelopeFollowersRef = useRef<EnvelopeFollower[]>([]);
  const transientDetectorsRef = useRef<TransientDetector[]>([]);

  useEffect(() => {
    energyRef.current = energy;
  }, [energy]);

  useEffect(() => {
    paletteRef.current = palette;
  }, [palette]);

  useEffect(() => {
    thumbnailColorsRef.current = thumbnailColors;
  }, [thumbnailColors]);

  useEffect(() => {
    songTimeRef.current = currentTime;
    songTimeUpdateRef.current = performance.now(); // Record wall clock time of update
  }, [currentTime]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    // Initialize envelope followers for each band
    envelopeFollowersRef.current = [
      new EnvelopeFollower(0.02, 0.2, 60), // BASS: slower attack, medium release
      new EnvelopeFollower(0.03, 0.25, 60), // VOCALS: medium attack/release
      new EnvelopeFollower(0.01, 0.15, 60), // SYNTH: fast attack, fast release
      new EnvelopeFollower(0.05, 0.3, 60), // BEAT: slow attack, slow release
    ];
    // Initialize transient detectors for each band
    transientDetectorsRef.current = [
      new TransientDetector(0.25, 0.15), // BASS
      new TransientDetector(0.2, 0.12), // VOCALS
      new TransientDetector(0.3, 0.08), // SYNTH
      new TransientDetector(0.35, 0.2), // BEAT
    ];
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    let animationFrame = 0;

    type GradientConfig = {
      x: number;
      y: number;
      anchorX: number;
      anchorY: number;
      radius: number;
      color: string;
      bandRole: number; // 0=bass, 1=vocals, 2=synth, 3=beat
      phaseOffset: number;
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.8);
      canvas.width = Math.floor(window.innerWidth * ratio);
      canvas.height = Math.floor(window.innerHeight * ratio);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    resize();

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Cache gradient colors to avoid recreation
    const gradientColors = thumbnailColorsRef.current;
    const gradients: GradientConfig[] = [
      {
        // BASS — top-left quadrant
        x: width * 0.25,
        y: height * 0.25,
        anchorX: 0.25,
        anchorY: 0.25,
        radius: Math.min(width, height) * 0.4,
        color: gradientColors[0] || '#ffffff',
        bandRole: 0,
        phaseOffset: 0,
      },
      {
        // VOCALS — top-right quadrant
        x: width * 0.75,
        y: height * 0.25,
        anchorX: 0.75,
        anchorY: 0.25,
        radius: Math.min(width, height) * 0.35,
        color: gradientColors[1] || '#ffffff',
        bandRole: 1,
        phaseOffset: 1.5,
      },
      {
        // SYNTH — bottom-left quadrant
        x: width * 0.25,
        y: height * 0.75,
        anchorX: 0.25,
        anchorY: 0.75,
        radius: Math.min(width, height) * 0.3,
        color: gradientColors[2] || '#ffffff',
        bandRole: 2,
        phaseOffset: 3,
      },
      {
        // BEAT — bottom-right quadrant
        x: width * 0.75,
        y: height * 0.75,
        anchorX: 0.75,
        anchorY: 0.75,
        radius: Math.min(width, height) * 0.25,
        color: gradientColors[3] || '#ffffff',
        bandRole: 3,
        phaseOffset: 4.5,
      },
    ];

    const draw = (time: number) => {
      const baseLevel = Math.max(0, Math.min(1, energyRef.current));
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Convert time from ms to seconds for frequency calculations
      const t = time / 1000;

      context.clearRect(0, 0, width, height);

      // Background is now black
      context.fillStyle = "rgba(0,0,0,1)";
      context.fillRect(0, 0, width, height);

      // Interpolate song time for smooth 60fps progression instead of 400ms jumps
      // YouTube's getCurrentTime() updates every ~250ms, so we estimate between updates
      const timeSinceUpdate = (performance.now() - songTimeUpdateRef.current) / 1000;
      const interpolatedSongTime = Math.max(0, songTimeRef.current + timeSinceUpdate);
      // Subtract 10ms to delay visuals so they align with audio reaching the ears
      const songT = Math.max(0, interpolatedSongTime - 0.01);
      const songDur = durationRef.current || 180; // default 3 min
      const songProgress = songT / songDur; // 0..1 across the whole song

      // Idle animation: when paused, use gentle sine wave from wall-clock time
      const isIdle = baseLevel === 0;
      const idleSignal = isIdle ? 0.4 + 0.15 * Math.sin(t * 0.5) : 0;

      for (const gradient of gradients) {
        const bandRole = gradient.bandRole;
        const phaseOffset = gradient.phaseOffset;

        // Song-structure drift (reduced for cleaner reactions)
        const structureDrift = Math.sin(songProgress * Math.PI * 4 + phaseOffset) * 0.1;
        const structureDrift2 = Math.cos(songProgress * Math.PI * 6 + phaseOffset * 0.7) * 0.08;

        // Per-band staggered time offset
        const bandDelay = bandRole * 0.04;
        const bandT = Math.max(0, songT - bandDelay);

        // Band-specific signal
        let bandSignal = 0;
        let radiusScale = 1;
        let opacityScale = 0.5;

        switch (bandRole) {
          case 0: {
            // BASS — Perlin noise + envelope follower for organic kick drum simulation
            const noise = perlinNoise(bandT * 0.5, phaseOffset, songProgress * 2) * 0.5 + 0.5;
            const bassFreq = 2.13 + structureDrift * 0.4;
            const rawBass = Math.sin(bandT * bassFreq * Math.PI * 2 + phaseOffset) * noise;
            bandSignal = rawBass > 0 ? Math.pow(rawBass, 0.35) : Math.pow(Math.abs(rawBass), 2.2) * 0.1;
            radiusScale = 2.2;
            opacityScale = 0.7;
            break;
          }
          case 1: {
            // VOCALS — multi-layered modulation with envelope
            const noise = perlinNoise(bandT * 0.8, phaseOffset * 1.5, songProgress * 3) * 0.4 + 0.6;
            const vocalFreq = 4.27 + structureDrift * 0.5;
            const carrier = Math.sin(bandT * vocalFreq * Math.PI * 2 + phaseOffset);
            const modulator = 0.5 + 0.5 * Math.sin(bandT * vocalFreq * 0.5 * Math.PI * 2 + phaseOffset * 0.7);
            const rawVocal = carrier * modulator * noise;
            bandSignal = rawVocal > 0 ? Math.pow(rawVocal, 0.4) : Math.pow(Math.abs(rawVocal), 1.6) * 0.15;
            radiusScale = 1.2;
            opacityScale = 0.8;
            break;
          }
          case 2: {
            // SYNTH — high frequency with Perlin noise variation
            const noise = perlinNoise(bandT * 1.2, phaseOffset * 2, songProgress * 4) * 0.3 + 0.7;
            const t1 = Math.sin(bandT * 8.5 * Math.PI * 2 + phaseOffset);
            const t2 = Math.sin(bandT * 12.8 * Math.PI * 2 + phaseOffset * 1.3);
            const t3 = Math.sin(bandT * 17.0 * Math.PI * 2 + phaseOffset * 0.7);
            const combined = (t1 + t2 + t3) / 3;
            const driftMod = 1 + structureDrift2 * 0.5;
            bandSignal = Math.abs(combined) * driftMod * noise * 1.2;
            radiusScale = 0.6;
            opacityScale = 0.45;
            break;
          }
          case 3: {
            // BEAT — amplitude modulation with transient detection
            const noise = perlinNoise(bandT * 0.3, phaseOffset * 0.5, songProgress * 1.5) * 0.5 + 0.5;
            const beatFreq = 1.07 + structureDrift * 0.3;
            const modFreq = beatFreq * 0.6;
            const carrier = Math.sin(bandT * beatFreq * Math.PI * 2 + phaseOffset);
            const modulator = 0.5 + 0.5 * Math.sin(bandT * modFreq * Math.PI * 2 + phaseOffset * 0.7);
            bandSignal = Math.abs(carrier * modulator) * noise * 1.15;
            radiusScale = 1.5;
            opacityScale = 0.6;
            break;
          }
        }

        // Apply envelope follower for attack/release simulation
        const envelopeFollower = envelopeFollowersRef.current[bandRole];
        if (envelopeFollower) {
          bandSignal = envelopeFollower.process(bandSignal);
        }

        // Apply transient detection for beat sync
        const transientDetector = transientDetectorsRef.current[bandRole];
        const isTransient = transientDetector ? transientDetector.process(bandSignal, t) : false;
        if (isTransient) {
          bandSignal = Math.min(1, bandSignal * 1.3); // Boost on transients
        }

        // Apply multi-stage smoothing for flicker-free transitions
        // Stage 1: Fast response (alpha=0.9) for immediate reaction
        const alpha1 = 0.9;
        const smoothed1 = alpha1 * bandSignal + (1 - alpha1) * smoothedSignalsRef.current[bandRole];
        smoothedSignalsRef.current[bandRole] = smoothed1;

        // Stage 2: Medium smoothing (alpha=0.5) for stability
        const alpha2 = 0.5;
        const smoothed2 = alpha2 * smoothed1 + (1 - alpha2) * smoothedSignalsStage2Ref.current[bandRole];
        smoothedSignalsStage2Ref.current[bandRole] = smoothed2;

        // Stage 3: Slow drift (alpha=0.1) for baseline
        const alpha3 = 0.1;
        const smoothed3 = alpha3 * smoothed2 + (1 - alpha3) * smoothedSignalsStage3Ref.current[bandRole];
        smoothedSignalsStage3Ref.current[bandRole] = smoothed3;

        bandSignal = smoothed3;

        // Peak-hold with exponential decay for punchy transients
        const peakDecayRate = 2.0; // Decay over ~0.5 seconds
        if (bandSignal > peakHoldRef.current[bandRole]) {
          peakHoldRef.current[bandRole] = bandSignal;
          peakHoldTimeRef.current[bandRole] = t;
        } else {
          const timeSincePeak = t - peakHoldTimeRef.current[bandRole];
          const decay = Math.exp(-timeSincePeak * peakDecayRate);
          peakHoldRef.current[bandRole] = bandSignal + (peakHoldRef.current[bandRole] - bandSignal) * decay;
        }
        // Blend current signal with peak-hold for punchy feel
        bandSignal = bandSignal * 0.7 + peakHoldRef.current[bandRole] * 0.3;

        const effectiveLevel = isIdle ? idleSignal : baseLevel * (0.2 + bandSignal * 0.8);

        // Update gradient position based on movement pattern
        let x = width * gradient.anchorX;
        let y = height * gradient.anchorY;

        if (bandRole === 0) {
          // BASS: expands/contracts from center, orbits slowly
          const orbitRadius = 30 + effectiveLevel * 50;
          const orbitSpeed = 0.0005;
          const angle = t * orbitSpeed + phaseOffset;
          x += Math.cos(angle) * orbitRadius;
          y += Math.sin(angle) * orbitRadius;
        } else if (bandRole === 1) {
          // VOCALS: gentle breathing/undulating motion (expands and contracts from center)
          const breatheRadius = 20 + effectiveLevel * 40;
          const breatheFreq = 0.0012;
          const breatheX = Math.sin(t * breatheFreq + phaseOffset) * breatheRadius;
          const breatheY = Math.cos(t * breatheFreq * 0.8 + phaseOffset * 0.6) * breatheRadius;
          x += breatheX;
          y += breatheY;
        } else if (bandRole === 2) {
          // SYNTH: moves in Lissajous figure (figure-8)
          const lissajousA = 60 + effectiveLevel * 40;
          const lissajousB = 40 + effectiveLevel * 30;
          const lissajousFreqX = 0.002;
          const lissajousFreqY = 0.003;
          x += Math.sin(t * lissajousFreqX + phaseOffset) * lissajousA;
          y += Math.sin(t * lissajousFreqY + phaseOffset * 0.7) * lissajousB;
        } else {
          // BEAT: drifts horizontally in sine wave
          const driftAmount = 50 + effectiveLevel * 80;
          const driftFreq = 0.001;
          x += Math.sin(t * driftFreq + phaseOffset) * driftAmount;
        }

        // Apply low-pass filter to positions for smooth movement
        const positionAlpha = 0.15; // Low-pass filter coefficient
        const smoothedX = positionAlpha * x + (1 - positionAlpha) * smoothedPositionsRef.current[bandRole].x;
        const smoothedY = positionAlpha * y + (1 - positionAlpha) * smoothedPositionsRef.current[bandRole].y;
        smoothedPositionsRef.current[bandRole] = { x: smoothedX, y: smoothedY };

        // Update gradient config
        gradient.x = smoothedX;
        gradient.y = smoothedY;

        // Calculate radius and opacity based on band signal
        const currentRadius = gradient.radius * (1 + effectiveLevel * radiusScale);
        const currentOpacity = 0.2 + effectiveLevel * opacityScale;

        // Render gradient
        const radial = context.createRadialGradient(x, y, 0, x, y, currentRadius);
        radial.addColorStop(0, hexToRgba(gradient.color, currentOpacity));
        radial.addColorStop(0.4, hexToRgba(gradient.color, currentOpacity * 0.6));
        radial.addColorStop(0.7, hexToRgba(gradient.color, currentOpacity * 0.3));
        radial.addColorStop(1, hexToRgba(gradient.color, 0));

        context.save();
        context.globalCompositeOperation = "screen";
        context.filter = `blur(20px)`;
        context.fillStyle = radial;
        context.fillRect(0, 0, width, height);
        context.restore();
      }

      animationFrame = window.requestAnimationFrame(draw);
    };

    animationFrame = window.requestAnimationFrame(draw);
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, [thumbnailColors]);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 h-full w-full opacity-100" aria-hidden="true" />;
}
