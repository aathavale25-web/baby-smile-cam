import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { drawMirroredVideo, drawImageOverlay } from '../utils/canvasUtils';

const CameraCanvas = forwardRef(function CameraCanvas(
  { videoRef, landmarks, activeOverlay, overlayImages, flash },
  ref
) {
  const canvasRef = useRef(null);

  useImperativeHandle(ref, () => canvasRef.current, []);

  useEffect(() => {
    let rafId;

    function draw() {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video || video.readyState < 2) {
        rafId = requestAnimationFrame(draw);
        return;
      }

      const W = video.videoWidth || 640;
      const H = video.videoHeight || 480;

      if (canvas.width !== W) canvas.width = W;
      if (canvas.height !== H) canvas.height = H;

      const ctx = canvas.getContext('2d');

      drawMirroredVideo(ctx, video, W, H);

      if (landmarks && activeOverlay && overlayImages) {
        drawImageOverlay(ctx, landmarks, activeOverlay, overlayImages, W, H);
      }

      if (flash) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(0, 0, W, H);
      }

      rafId = requestAnimationFrame(draw);
    }

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [videoRef, landmarks, activeOverlay, overlayImages, flash]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-xl"
      style={{ aspectRatio: '16/9', background: '#111' }}
    />
  );
});

export default CameraCanvas;
