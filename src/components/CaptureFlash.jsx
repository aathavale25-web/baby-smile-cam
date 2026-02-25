import { useState, useEffect } from 'react';

/**
 * Returns flash boolean — true for ~100ms after each capture trigger.
 * @param {number} triggered - increments on each capture
 */
export function useCaptureFlash(triggered) {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (triggered === 0) return;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 100);
    return () => clearTimeout(t);
  }, [triggered]);

  return flash;
}

export default function CaptureFlash() {
  return null; // Flash is rendered directly in CameraCanvas via flash prop
}
