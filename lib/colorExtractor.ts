const FALLBACK_COLORS = ["#151019", "#2d2d3a", "#3d3d4a", "#4a4a5a", "#5a5a6a"];
const FALLBACK_SUPPLEMENT = [FALLBACK_COLORS[2], FALLBACK_COLORS[3], FALLBACK_COLORS[4]];

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

function luminance(red: number, green: number, blue: number) {
  return 0.299 * red + 0.587 * green + 0.114 * blue;
}

function quantizeChannel(value: number) {
  return Math.min(255, Math.round(value / 8) * 8);
}

function quantize(values: Uint8ClampedArray) {
  const buckets = new Map<string, { count: number; brightness: number }>();

  // Sample every 4th pixel instead of every 16th for more accurate color capture
  for (let index = 0; index < values.length; index += 4) {
    const r = values[index] ?? 0;
    const g = values[index + 1] ?? 0;
    const b = values[index + 2] ?? 0;
    const alpha = values[index + 3] ?? 0;

    // Skip transparent or semi-transparent pixels
    if (alpha < 200) {
      continue;
    }

    // Skip very dark pixels (likely shadows/background)
    const brightness = luminance(r, g, b);
    if (brightness < 20) {
      continue;
    }

    const quantizedRed = quantizeChannel(r);
    const quantizedGreen = quantizeChannel(g);
    const quantizedBlue = quantizeChannel(b);
    const key = `${quantizedRed}-${quantizedGreen}-${quantizedBlue}`;
    const current = buckets.get(key);

    buckets.set(key, {
      count: (current?.count ?? 0) + 1,
      brightness,
    });
  }

  const sorted = [...buckets.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .map(([key, value]) => ({
      key,
      brightness: value.brightness,
    }))
    .filter((entry) => entry.brightness >= 25)
    .slice(0, 5)
    .map(({ key }) => {
      const [r, g, b] = key.split("-").map((value) => Number(value));
      return rgbToHex(r, g, b);
    });

  return sorted;
}

export async function extractPaletteFromImage(url: string) {
  if (typeof window === "undefined") {
    return FALLBACK_COLORS;
  }

  try {
    const image = new Image();
    image.crossOrigin = "anonymous";

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Image load failed"));
      image.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 200;
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) {
      return FALLBACK_COLORS;
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    const palette = quantize(data);
    if (palette.length >= 2) {
      return palette;
    }

    const supplemented = [...palette];
    for (const color of FALLBACK_SUPPLEMENT) {
      if (supplemented.length >= 5) {
        break;
      }

      if (!supplemented.includes(color)) {
        supplemented.push(color);
      }
    }

    return supplemented.length > 0 ? supplemented : FALLBACK_COLORS;
  } catch (error) {
    console.warn("Falling back to the base palette because thumbnail extraction failed.", error);
    return FALLBACK_COLORS;
  }
}

export function getFallbackPalette() {
  return FALLBACK_COLORS;
}
