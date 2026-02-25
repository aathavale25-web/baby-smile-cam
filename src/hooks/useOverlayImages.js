import { useState, useEffect } from 'react';
import { OVERLAYS } from '../config/overlays';

/**
 * Fetches all overlay SVGs as blob URLs, loads them as HTMLImageElements,
 * and returns a map of { [overlayId]: HTMLImageElement }.
 *
 * Using blob URLs (not direct CDN URLs) prevents the canvas from being
 * tainted when we call toDataURL() for photo capture.
 */
export default function useOverlayImages() {
  const [images, setImages] = useState({});

  useEffect(() => {
    let active = true;
    const loaded = {};
    let settled = 0;

    function onSettled() {
      settled++;
      if (settled === OVERLAYS.length && active) {
        setImages({ ...loaded });
      }
    }

    OVERLAYS.forEach(overlay => {
      fetch(overlay.imageUrl)
        .then(r => r.blob())
        .then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => {
            if (active) loaded[overlay.id] = img;
            onSettled();
          };
          img.onerror = onSettled;
          img.src = blobUrl;
        })
        .catch(onSettled);
    });

    return () => { active = false; };
  }, []);

  return images;
}
