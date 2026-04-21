'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_AMBIENT_COLORS,
  extractDominantColors,
} from '../utils/colorExtractor';

export default function useAmbientColor(imageUrl) {
  const [colors, setColors] = useState(DEFAULT_AMBIENT_COLORS);

  useEffect(() => {
    let isActive = true;

    if (!imageUrl) {
      setColors(DEFAULT_AMBIENT_COLORS);
      return undefined;
    }

    void extractDominantColors(imageUrl)
      .then((nextColors) => {
        if (isActive) {
          setColors(nextColors);
        }
      })
      .catch(() => {
        if (isActive) {
          setColors(DEFAULT_AMBIENT_COLORS);
        }
      });

    return () => {
      isActive = false;
    };
  }, [imageUrl]);

  return colors;
}
