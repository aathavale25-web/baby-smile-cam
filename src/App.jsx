import { useState, useCallback, useEffect, useRef } from 'react';
import useCamera from './hooks/useCamera';
import useSmileDetector from './hooks/useSmileDetector';
import useCapture from './hooks/useCapture';
import useOverlayImages from './hooks/useOverlayImages';
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

function CameraIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-sky-400 mx-auto mb-1" aria-hidden="true">
      <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
      <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM6.75 12.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Zm12-1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
    </svg>
  );
}

function FlipCameraIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  );
}

export default function App() {
  const [activeOverlay, setActiveOverlay] = useState(OVERLAYS[0]);
  const [captureCount, setCaptureCount] = useState(0);
  const canvasRef = useRef(null);

  const { videoRef, isReady, error, toggleCamera, startCamera } = useCamera();
  const { photos, addPhoto, clearPhotos } = useCapture();
  const overlayImages = useOverlayImages();
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
    <div className="min-h-screen py-6 px-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">

        {/* Header */}
        <header className="text-center pt-2">
          <CameraIcon />
          <h1 className="font-display text-5xl font-semibold text-sky-800 leading-tight">
            Baby Smile Cam
          </h1>
          <p className="text-sky-500 text-lg mt-1 font-medium">
            Smile and I&apos;ll catch it!
          </p>
          {!isLoaded && (
            <span className="inline-block mt-3 bg-sky-100 text-sky-600 text-sm font-semibold rounded-full px-4 py-1.5 border-2 border-sky-200">
              Loading face detection...
            </span>
          )}
        </header>

        <HiddenVideo videoRef={videoRef} />

        {/* Error state */}
        {error && (
          <div className="clay-card bg-red-50 border-red-200 p-4 text-red-700 text-sm text-center font-semibold">
            {error}
          </div>
        )}

        {/* Camera canvas card */}
        <div className="clay-card overflow-hidden p-0 relative"
          style={{ borderColor: 'rgba(56,189,248,0.4)' }}>
          <CameraCanvas
            ref={canvasRef}
            videoRef={videoRef}
            landmarks={landmarks}
            activeOverlay={activeOverlay}
            overlayImages={overlayImages}
            flash={flash}
          />

          {/* Camera flip button */}
          <button
            onClick={toggleCamera}
            className="clay-btn absolute top-3 right-3 bg-white/90 text-sky-600 p-2.5 hover:bg-white hover:text-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
            aria-label="Switch camera"
            style={{ borderColor: 'rgba(255,255,255,0.9)' }}
          >
            <FlipCameraIcon />
          </button>

          {/* Face detected badge */}
          {isLoaded && landmarks && (
            <div className="absolute top-3 left-3 bg-green-100 text-green-700 text-xs font-bold rounded-full px-3 py-1.5 border-2 border-green-200 shadow-sm">
              Face detected ✓
            </div>
          )}
        </div>

        {/* Overlay selector card */}
        <div className="clay-card p-4" style={{ background: 'linear-gradient(135deg, #f0f9ff, #ede9fe)' }}>
          <p className="font-display text-sky-700 text-lg font-semibold mb-3 text-center">
            Choose a filter
          </p>
          <OverlaySelector
            activeId={activeOverlay.id}
            overlayImages={overlayImages}
            onChange={setActiveOverlay}
          />
        </div>

        {/* Gallery */}
        <Gallery photos={photos} onClear={clearPhotos} />

      </div>
    </div>
  );
}
