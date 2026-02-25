import { useRef, useState, useEffect } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

const SMILE_THRESHOLD = 0.65;
const CONSECUTIVE_FRAMES = 3;
const COOLDOWN_MS = 3000;

/**
 * Initializes MediaPipe FaceLandmarker and runs detection loop.
 *
 * @param {React.RefObject} videoRef - ref to the playing <video> element
 * @param {boolean} isVideoReady - true when video has loaded metadata
 * @param {function} onSmile - called with (landmarks, blendshapes) when smile detected
 * @returns {{ landmarks, blendshapes, isLoaded }}
 */
export default function useSmileDetector(videoRef, isVideoReady, onSmile) {
  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const smileFramesRef = useRef(0);
  const lastCaptureRef = useRef(0);
  const onSmileRef = useRef(onSmile);
  onSmileRef.current = onSmile;

  const [isLoaded, setIsLoaded] = useState(false);
  const [landmarks, setLandmarks] = useState(null);
  const [blendshapes, setBlendshapes] = useState(null);

  // Initialize MediaPipe once
  useEffect(() => {
    let cancelled = false;
    async function init() {
      const filesetResolver = await FilesetResolver.forVisionTasks(WASM_URL);
      const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: 'GPU',
        },
        outputFaceBlendshapes: true,
        runningMode: 'VIDEO',
        numFaces: 1,
      });
      if (!cancelled) {
        landmarkerRef.current = faceLandmarker;
        setIsLoaded(true);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  // Detection loop
  useEffect(() => {
    if (!isLoaded || !isVideoReady) return;

    function detect() {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !landmarker || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(detect);
        return;
      }

      const result = landmarker.detectForVideo(video, performance.now());

      if (result.faceLandmarks.length > 0) {
        const lms = result.faceLandmarks[0];
        const shapes = result.faceBlendshapes[0]?.categories ?? [];
        setLandmarks(lms);
        setBlendshapes(shapes);

        const smileLeft = shapes.find(c => c.categoryName === 'mouthSmileLeft')?.score ?? 0;
        const smileRight = shapes.find(c => c.categoryName === 'mouthSmileRight')?.score ?? 0;
        const smileScore = (smileLeft + smileRight) / 2;

        if (smileScore >= SMILE_THRESHOLD) {
          smileFramesRef.current += 1;
        } else {
          smileFramesRef.current = 0;
        }

        const now = Date.now();
        if (
          smileFramesRef.current >= CONSECUTIVE_FRAMES &&
          now - lastCaptureRef.current > COOLDOWN_MS
        ) {
          lastCaptureRef.current = now;
          smileFramesRef.current = 0;
          onSmileRef.current(lms, shapes);
        }
      } else {
        setLandmarks(null);
        setBlendshapes(null);
        smileFramesRef.current = 0;
      }

      rafRef.current = requestAnimationFrame(detect);
    }

    rafRef.current = requestAnimationFrame(detect);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isLoaded, isVideoReady, videoRef]);

  return { landmarks, blendshapes, isLoaded };
}
