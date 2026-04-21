'use client';

import { useContext } from 'react';
import { MusicContext } from '../context/MusicContext';

export default function useMusic() {
  const context = useContext(MusicContext);

  if (!context) {
    throw new Error('useMusic must be used within MusicProvider.');
  }

  return context;
}
