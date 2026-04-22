// Shared animation utilities for consistent, theme-appropriate animations

// Perlin noise implementation for organic movement
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

export function perlinNoise(x: number, y: number, z: number) {
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

// Spring physics configurations for consistent animations
export const springConfigs = {
  gentle: { type: "spring" as const, stiffness: 100, damping: 20, mass: 0.9 },
  snappy: { type: "spring" as const, stiffness: 120, damping: 18, mass: 0.8 },
  bouncy: { type: "spring" as const, stiffness: 140, damping: 16, mass: 0.7 },
  smooth: { type: "spring" as const, stiffness: 90, damping: 22, mass: 1.0 },
  fast: { type: "spring" as const, stiffness: 180, damping: 15, mass: 0.6 },
};

// Magnetic effect helper for cursor attraction
export function calculateMagneticOffset(
  mouseX: number,
  mouseY: number,
  elementX: number,
  elementY: number,
  elementWidth: number,
  elementHeight: number,
  strength = 0.3
) {
  const centerX = elementX + elementWidth / 2;
  const centerY = elementY + elementHeight / 2;
  const deltaX = (mouseX - centerX) * strength;
  const deltaY = (mouseY - centerY) * strength;
  return { x: deltaX, y: deltaY };
}

// Glass sheen animation utility
export function getGlassSheenStyle(progress: number) {
  return {
    background: `linear-gradient(135deg, 
      transparent 0%, 
      rgba(255, 255, 255, ${0.05 + progress * 0.1}) ${progress * 50}%, 
      transparent ${progress * 100}%)`,
  };
}

// Music-reactive animation utilities
export function getMusicReactiveScale(energy: number, baseScale = 1, maxScale = 1.05) {
  return baseScale + energy * (maxScale - baseScale);
}

export function getMusicReactiveGlow(energy: number, baseAlpha = 0.12, maxAlpha = 0.28) {
  return baseAlpha + energy * (maxAlpha - baseAlpha);
}

export function getMusicReactivePulse(energy: number, time: number) {
  const pulseSpeed = 2 + energy * 3;
  return (Math.sin(time * 0.001 * pulseSpeed) + 1) / 2;
}

// Stagger delay calculator
export function getStaggerDelay(index: number, baseDelay = 0.06, stagger = 0.04) {
  return baseDelay + index * stagger;
}

// Clamp utility
export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
