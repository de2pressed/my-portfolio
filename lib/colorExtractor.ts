const FALLBACK_COLORS = ["#151019", "#b93ca7", "#7a57e8", "#271d31", "#f2e8f6"];

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

function quantize(values: Uint8ClampedArray) {
  const buckets = new Map<string, number>();

  for (let index = 0; index < values.length; index += 16) {
    const r = values[index] ?? 0;
    const g = values[index + 1] ?? 0;
    const b = values[index + 2] ?? 0;
    const alpha = values[index + 3] ?? 0;

    if (alpha < 180) {
      continue;
    }

    const key = `${Math.round(r / 32) * 32}-${Math.round(g / 32) * 32}-${Math.round(b / 32) * 32}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key]) => {
      const [r, g, b] = key.split("-").map((value) => Number(value));
      return rgbToHex(r, g, b);
    });
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
    canvas.width = 72;
    canvas.height = 72;
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) {
      return FALLBACK_COLORS;
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    const palette = quantize(data);
    return palette.length > 0 ? palette : FALLBACK_COLORS;
  } catch (error) {
    console.warn("Falling back to the base palette because thumbnail extraction failed.", error);
    return FALLBACK_COLORS;
  }
}

export function getFallbackPalette() {
  return FALLBACK_COLORS;
}
