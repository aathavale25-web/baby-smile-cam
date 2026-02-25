import { useRef, useState, useCallback } from 'react';

/**
 * Manages webcam stream lifecycle.
 * Returns: { videoRef, isReady, error, facingMode, toggleCamera, startCamera }
 *
 * isReady: true once the video element has loaded metadata (has dimensions)
 * error: string | null — set when getUserMedia is denied
 * facingMode: 'user' | 'environment'
 * toggleCamera: flips between front and back camera
 */
export default function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('user');

  const startCamera = useCallback(async (mode = 'user') => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    setIsReady(false);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setIsReady(true);
        };
      }
    } catch {
      setError('Camera access denied. Please allow camera permissions and refresh.');
    }
  }, []);

  const toggleCamera = useCallback(() => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    startCamera(next);
  }, [facingMode, startCamera]);

  return { videoRef, isReady, error, facingMode, toggleCamera, startCamera };
}
