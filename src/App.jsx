import { useState, useCallback, useEffect, useRef } from 'react';
import useCamera from './hooks/useCamera';
import useSmileDetector from './hooks/useSmileDetector';
import useCapture from './hooks/useCapture';
import { useCaptureFlash } from './components/CaptureFlash';
import CameraCanvas from './components/CameraCanvas';
import OverlaySelector from './components/OverlaySelector';
import Gallery from './components/Gallery';
import { OVERLAYS } from './config/overlays';

function HiddenVideo({ videoRef }) {
  return (
    <video
      ref={videoRef}
      playsInline
      muted
      style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
    />
  );
}

export default function App() {
  const [activeOverlay, setActiveOverlay] = useState(OVERLAYS[0]);
  const [captureCount, setCaptureCount] = useState(0);
  const canvasRef = useRef(null);

  const { videoRef, isReady, error, toggleCamera, startCamera } = useCamera();
  const { photos, addPhoto, clearPhotos } = useCapture();
  const flash = useCaptureFlash(captureCount);

  useEffect(() => { startCamera('user'); }, [startCamera]);

  const handleSmile = useCallback(() => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
      addPhoto(dataUrl);
    }
    setCaptureCount(c => c + 1);
  }, [addPhoto]);

  const { landmarks, isLoaded } = useSmileDetector(videoRef, isReady, handleSmile);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-2xl mx-auto">
      <header className="text-center py-4 px-4">
        <h1 className="text-2xl font-bold text-white">Baby Smile Cam 📸</h1>
        {!isLoaded && (
          <p className="text-white/40 text-sm mt-1">Loading face detection...</p>
        )}
      </header>

      <HiddenVideo videoRef={videoRef} />

      {error && (
        <div className="mx-4 p-4 bg-red-900/40 rounded-xl text-red-300 text-sm text-center">
          {error}
        </div>
      )}

      <div className="px-4 relative">
        <CameraCanvas
          ref={canvasRef}
          videoRef={videoRef}
          landmarks={landmarks}
          activeOverlay={activeOverlay}
          flash={flash}
        />
        <button
          onClick={toggleCamera}
          className="absolute top-3 right-7 bg-black/50 text-white rounded-full p-2 text-lg hover:bg-black/70 transition-colors"
          title="Switch camera"
        >
          🔄
        </button>
        {isLoaded && landmarks && (
          <div className="absolute top-3 left-7 bg-black/50 text-green-400 text-xs rounded-full px-2 py-1">
            Face detected ✓
          </div>
        )}
      </div>

      <OverlaySelector activeId={activeOverlay.id} onChange={setActiveOverlay} />
      <Gallery photos={photos} onClear={clearPhotos} />
    </div>
  );
}
