export const DEFAULT_AMBIENT_COLORS = ['#a78bfa', '#60a5fa', '#f472b6'];

function rgbToHex(red, green, blue) {
  return `#${[red, green, blue]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`;
}

export async function extractDominantColors(imageUrl) {
  const image = await new Promise((resolve, reject) => {
    const nextImage = new Image();
    nextImage.crossOrigin = 'anonymous';
    nextImage.onload = () => resolve(nextImage);
    nextImage.onerror = () => reject(new Error('Image load failed.'));
    nextImage.src = imageUrl;
  });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (!context) {
    return DEFAULT_AMBIENT_COLORS;
  }

  canvas.width = 24;
  canvas.height = 24;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let pixels;

  try {
    pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  } catch {
    return DEFAULT_AMBIENT_COLORS;
  }

  const buckets = new Map();

  for (let index = 0; index < pixels.length; index += 16) {
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    const alpha = pixels[index + 3];

    if (alpha < 120) {
      continue;
    }

    const quantized = [red, green, blue].map((channel) =>
      Math.min(255, Math.round(channel / 32) * 32),
    );
    const key = quantized.join(',');
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }

  const topColors = [...buckets.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([key]) => {
      const [red, green, blue] = key.split(',').map(Number);
      return rgbToHex(red, green, blue);
    });

  if (!topColors.length) {
    return DEFAULT_AMBIENT_COLORS;
  }

  return [...topColors, ...DEFAULT_AMBIENT_COLORS].slice(0, 3);
}
