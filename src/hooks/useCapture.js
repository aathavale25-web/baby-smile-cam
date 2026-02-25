import { useState, useCallback, useRef } from 'react';

const MAX_PHOTOS = 20;

/**
 * Manages the in-session photo gallery.
 * Returns: { photos, addPhoto, clearPhotos, captureFromCanvas }
 *
 * photos: [{ id, dataUrl, timestamp }]
 * addPhoto(dataUrl): adds to gallery, drops oldest if > 20
 * clearPhotos(): empties gallery
 * captureFromCanvas(canvasRef): captures canvas to dataUrl + adds to gallery
 */
export default function useCapture() {
  const [photos, setPhotos] = useState([]);
  const idRef = useRef(0);

  const addPhoto = useCallback((dataUrl) => {
    const photo = {
      id: idRef.current++,
      dataUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setPhotos(prev => {
      const next = [...prev, photo];
      return next.length > MAX_PHOTOS ? next.slice(next.length - MAX_PHOTOS) : next;
    });
  }, []);

  const clearPhotos = useCallback(() => setPhotos([]), []);

  const captureFromCanvas = useCallback((canvasRef) => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
    addPhoto(dataUrl);
  }, [addPhoto]);

  return { photos, addPhoto, clearPhotos, captureFromCanvas };
}
