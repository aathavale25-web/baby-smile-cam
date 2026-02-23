# Baby Smile Cam Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a webcam app that shows fun emoji overlays on a baby's face and auto-captures a photo when a smile is detected, storing captures in an in-session gallery.

**Architecture:** React hooks manage camera stream and detection state. MediaPipe FaceLandmarker runs in a `requestAnimationFrame` loop, returning 478 face landmarks and blendshape scores per frame. A `<canvas>` draws the mirrored video + emoji overlays at computed landmark positions. When the `mouthSmileLeft` + `mouthSmileRight` blendshape average exceeds 0.65 for 3 consecutive frames, the canvas is captured via `toDataURL` and pushed into a gallery state array. A 3-second cooldown prevents burst captures.

**Tech Stack:** React 19, Vite, Tailwind CSS v4, `@mediapipe/tasks-vision` (FaceLandmarker via CDN WASM), Canvas API, Vitest

---

### Task 1: Vitest setup + project structure

**Files:**
- Modify: `package.json` (add test scripts)
- Create: `vitest.config.js`
- Create: `src/test/setup.js`
- Create (stubs): all source files listed below

**Step 1: Create `vitest.config.js`**

```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
  },
});
```

**Step 2: Create `src/test/setup.js`**

```javascript
import '@testing-library/jest-dom';
```

**Step 3: Add test scripts to `package.json`**

In `scripts`, add:
```json
"test": "vitest",
"test:ui": "vitest --ui"
```

**Step 4: Create all stub files**

Create each file with a minimal stub so the project imports don't break during development:

- `src/config/overlays.js` → `export const OVERLAYS = [];`
- `src/utils/landmarkUtils.js` → `export {};`
- `src/utils/canvasUtils.js` → `export {};`
- `src/hooks/useCamera.js` → `export default function useCamera() { return {}; }`
- `src/hooks/useSmileDetector.js` → `export default function useSmileDetector() { return {}; }`
- `src/hooks/useCapture.js` → `export default function useCapture() { return {}; }`
- `src/components/CameraCanvas.jsx` → `export default function CameraCanvas() { return <div/>; }`
- `src/components/OverlaySelector.jsx` → `export default function OverlaySelector() { return <div/>; }`
- `src/components/Gallery.jsx` → `export default function Gallery() { return <div/>; }`
- `src/components/CaptureFlash.jsx` → `export default function CaptureFlash() { return null; }`

**Step 5: Run tests (should pass with 0 tests)**

```bash
npm test -- --run
```
Expected: "No test files found"

**Step 6: Commit**

```bash
git add .
git commit -m "chore: vitest setup + project file stubs"
```

---

### Task 2: Overlay config + landmark utility functions

**Files:**
- Modify: `src/config/overlays.js`
- Modify: `src/utils/landmarkUtils.js`
- Create: `src/utils/landmarkUtils.test.js`

**Background — MediaPipe landmark indices used:**
- `10` = top of forehead
- `168` = nose bridge (between eyes)
- `4` = nose tip
- `234` = left ear
- `454` = right ear
- `152` = chin

Landmarks are returned as `{ x, y, z }` normalized 0–1. Multiply by canvas `width`/`height` to get pixels.

**Step 1: Write failing tests for `landmarkUtils`**

Create `src/utils/landmarkUtils.test.js`:

```javascript
import { getLandmarkPx, faceWidth, faceHeight } from './landmarkUtils';

const mockLandmarks = Array(468).fill({ x: 0.5, y: 0.5, z: 0 });
// Override specific indices
const landmarks = [...mockLandmarks];
landmarks[234] = { x: 0.2, y: 0.5, z: 0 }; // left ear
landmarks[454] = { x: 0.8, y: 0.5, z: 0 }; // right ear
landmarks[10]  = { x: 0.5, y: 0.1, z: 0 }; // forehead
landmarks[152] = { x: 0.5, y: 0.9, z: 0 }; // chin

const W = 640, H = 480;

describe('getLandmarkPx', () => {
  it('converts normalized coords to pixel coords', () => {
    const { x, y } = getLandmarkPx(landmarks, 234, W, H);
    expect(x).toBe(128); // 0.2 * 640
    expect(y).toBe(240); // 0.5 * 480
  });
});

describe('faceWidth', () => {
  it('returns pixel distance between ears', () => {
    expect(faceWidth(landmarks, W)).toBe(384); // (0.8 - 0.2) * 640
  });
});

describe('faceHeight', () => {
  it('returns pixel distance from forehead to chin', () => {
    expect(faceHeight(landmarks, H)).toBe(384); // (0.9 - 0.1) * 480
  });
});
```

**Step 2: Run to verify they fail**

```bash
npm test -- --run
```
Expected: FAIL — `getLandmarkPx is not a function`

**Step 3: Implement `landmarkUtils.js`**

```javascript
/**
 * Convert a normalized landmark to pixel coordinates.
 * @param {Array} landmarks - array of { x, y, z } normalized 0-1
 * @param {number} index - landmark index
 * @param {number} W - canvas width in pixels
 * @param {number} H - canvas height in pixels
 * @returns {{ x: number, y: number }}
 */
export function getLandmarkPx(landmarks, index, W, H) {
  const lm = landmarks[index];
  return { x: lm.x * W, y: lm.y * H };
}

/**
 * Pixel distance between left ear (234) and right ear (454).
 */
export function faceWidth(landmarks, W) {
  return (landmarks[454].x - landmarks[234].x) * W;
}

/**
 * Pixel distance between forehead (10) and chin (152).
 */
export function faceHeight(landmarks, H) {
  return (landmarks[152].y - landmarks[10].y) * H;
}
```

**Step 4: Run tests — should pass**

```bash
npm test -- --run
```
Expected: PASS (3 tests)

**Step 5: Implement `src/config/overlays.js`**

Each overlay defines: emoji, how to anchor it (landmark index), and scale relative to face width.

```javascript
/**
 * Overlay configuration.
 * anchor: landmark index used as the positioning reference point
 * offsetYRatio: vertical offset as fraction of faceWidth (negative = up)
 * sizeRatio: emoji font size as fraction of faceWidth
 */
export const OVERLAYS = [
  {
    id: 'top-hat',
    label: 'Top Hat',
    emoji: '🎩',
    anchor: 10,        // forehead top
    offsetYRatio: -0.3,
    sizeRatio: 0.8,
  },
  {
    id: 'glasses',
    label: 'Glasses',
    emoji: '👓',
    anchor: 168,       // nose bridge
    offsetYRatio: -0.1,
    sizeRatio: 0.7,
  },
  {
    id: 'bunny-ears',
    label: 'Bunny Ears',
    emoji: '🐰',
    anchor: 10,        // forehead top
    offsetYRatio: -0.5,
    sizeRatio: 0.9,
  },
  {
    id: 'frog',
    label: 'Frog',
    emoji: '🐸',
    anchor: 168,       // nose bridge
    offsetYRatio: -0.2,
    sizeRatio: 1.0,
  },
  {
    id: 'butterfly',
    label: 'Butterfly',
    emoji: '🦋',
    anchor: 4,         // nose tip
    offsetYRatio: -0.15,
    sizeRatio: 0.5,
  },
  {
    id: 'cowboy-hat',
    label: 'Cowboy Hat',
    emoji: '🤠',
    anchor: 10,        // forehead top
    offsetYRatio: -0.35,
    sizeRatio: 0.9,
  },
];
```

**Step 6: Commit**

```bash
git add .
git commit -m "feat: landmark utils + overlay config"
```

---

### Task 3: `useCamera` hook

**Files:**
- Modify: `src/hooks/useCamera.js`

No unit tests — this hook wraps browser APIs (`getUserMedia`). Verify manually.

**Step 1: Implement `useCamera.js`**

```javascript
import { useRef, useState, useCallback } from 'react';

/**
 * Manages webcam stream lifecycle.
 * Returns: { videoRef, isReady, error, facingMode, toggleCamera }
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
    // Stop any existing stream
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
    } catch (err) {
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
```

**Step 2: Commit**

```bash
git add src/hooks/useCamera.js
git commit -m "feat: useCamera hook for webcam stream management"
```

---

### Task 4: `useSmileDetector` hook (MediaPipe)

**Files:**
- Modify: `src/hooks/useSmileDetector.js`

**Background — MediaPipe FaceLandmarker setup:**
- Load WASM from CDN: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm`
- Model from CDN: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`
- Run in `VIDEO` mode — pass each frame with `detectForVideo(video, timestamp)`
- Returns `{ faceLandmarks: [[{x,y,z}...]], faceBlendshapes: [{categories: [{categoryName, score}...]}] }`
- Smile score: average of `mouthSmileLeft` and `mouthSmileRight` category scores

**Step 1: Implement `useSmileDetector.js`**

```javascript
import { useRef, useState, useCallback, useEffect } from 'react';
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

        // Smile score = average of left + right smile blendshapes
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
          onSmile(lms, shapes);
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
  }, [isLoaded, isVideoReady, videoRef, onSmile]);

  return { landmarks, blendshapes, isLoaded };
}
```

**Step 2: Commit**

```bash
git add src/hooks/useSmileDetector.js
git commit -m "feat: useSmileDetector hook with MediaPipe FaceLandmarker"
```

---

### Task 5: `useCapture` hook + gallery state

**Files:**
- Modify: `src/hooks/useCapture.js`
- Create: `src/hooks/useCapture.test.js`

**Step 1: Write failing tests for gallery state logic**

Create `src/hooks/useCapture.test.js`:

```javascript
import { renderHook, act } from '@testing-library/react';
import useCapture from './useCapture';

describe('useCapture', () => {
  it('starts with empty gallery', () => {
    const { result } = renderHook(() => useCapture());
    expect(result.current.photos).toEqual([]);
  });

  it('adds a photo to gallery', () => {
    const { result } = renderHook(() => useCapture());
    act(() => result.current.addPhoto('data:image/jpeg;base64,abc'));
    expect(result.current.photos).toHaveLength(1);
    expect(result.current.photos[0].dataUrl).toBe('data:image/jpeg;base64,abc');
    expect(result.current.photos[0].timestamp).toBeDefined();
  });

  it('caps gallery at 20 photos, dropping oldest', () => {
    const { result } = renderHook(() => useCapture());
    act(() => {
      for (let i = 0; i < 25; i++) {
        result.current.addPhoto(`data:image/jpeg;base64,${i}`);
      }
    });
    expect(result.current.photos).toHaveLength(20);
    // Oldest (0-4) should be gone, newest (5-24) remain
    expect(result.current.photos[0].dataUrl).toBe('data:image/jpeg;base64,5');
  });

  it('clears all photos', () => {
    const { result } = renderHook(() => useCapture());
    act(() => result.current.addPhoto('data:image/jpeg;base64,abc'));
    act(() => result.current.clearPhotos());
    expect(result.current.photos).toEqual([]);
  });
});
```

**Step 2: Run — verify they fail**

```bash
npm test -- --run
```
Expected: FAIL

**Step 3: Implement `useCapture.js`**

```javascript
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
```

**Step 4: Run tests — should pass**

```bash
npm test -- --run
```
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add .
git commit -m "feat: useCapture hook with gallery state + tests"
```

---

### Task 6: `CameraCanvas` component

**Files:**
- Modify: `src/components/CameraCanvas.jsx`
- Modify: `src/utils/canvasUtils.js`

**Background — canvas drawing:**
- Video is drawn **mirrored** (flip ctx horizontally)
- Landmark x positions are mirrored: `mirroredX = canvasWidth - landmark.x * canvasWidth`
- Emoji overlays use `ctx.font = '${size}px serif'` and `ctx.fillText`
- Canvas size matches video's `videoWidth` × `videoHeight`

**Step 1: Implement `canvasUtils.js`**

```javascript
import { getLandmarkPx, faceWidth } from './landmarkUtils';

/**
 * Draw the video frame mirrored onto the canvas.
 */
export function drawMirroredVideo(ctx, video, W, H) {
  ctx.save();
  ctx.translate(W, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, W, H);
  ctx.restore();
}

/**
 * Draw an emoji overlay anchored to a face landmark.
 * Landmark x is mirrored since video is drawn mirrored.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} landmarks - normalized landmarks array
 * @param {object} overlay - overlay config from OVERLAYS
 * @param {number} W - canvas width
 * @param {number} H - canvas height
 */
export function drawEmojiOverlay(ctx, landmarks, overlay, W, H) {
  const fw = faceWidth(landmarks, W);
  const size = Math.max(20, fw * overlay.sizeRatio);
  const { x, y } = getLandmarkPx(landmarks, overlay.anchor, W, H);

  // Mirror x since video is mirrored
  const mirroredX = W - x;
  const offsetY = fw * overlay.offsetYRatio;

  ctx.font = `${size}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(overlay.emoji, mirroredX, y + offsetY);
}
```

**Step 2: Implement `CameraCanvas.jsx`**

```jsx
import { useRef, useEffect } from 'react';
import { drawMirroredVideo, drawEmojiOverlay } from '../utils/canvasUtils';

/**
 * Renders the live camera feed + emoji overlay on a <canvas>.
 * Calls onFrame each animation frame with the canvas ref (for capturing).
 *
 * Props:
 *   videoRef     - ref to the playing <video> element
 *   landmarks    - current face landmarks array (null if no face)
 *   activeOverlay - overlay config object from OVERLAYS
 *   onFrame      - (canvasRef) => void, called each frame
 *   flash        - boolean, if true draws a white overlay for one frame
 */
export default function CameraCanvas({ videoRef, landmarks, activeOverlay, onFrame, flash }) {
  const canvasRef = useRef(null);

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

      // Draw mirrored video
      drawMirroredVideo(ctx, video, W, H);

      // Draw overlay if face detected
      if (landmarks && activeOverlay) {
        drawEmojiOverlay(ctx, landmarks, activeOverlay, W, H);
      }

      // White flash
      if (flash) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(0, 0, W, H);
      }

      onFrame?.(canvasRef);
      rafId = requestAnimationFrame(draw);
    }

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [videoRef, landmarks, activeOverlay, onFrame, flash]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-xl"
      style={{ aspectRatio: '16/9', objectFit: 'cover', background: '#111' }}
    />
  );
}
```

**Step 3: Run tests still pass**

```bash
npm test -- --run
```
Expected: PASS (all existing tests)

**Step 4: Commit**

```bash
git add .
git commit -m "feat: CameraCanvas component + canvas drawing utilities"
```

---

### Task 7: `OverlaySelector` + `CaptureFlash` + `Gallery` components

**Files:**
- Modify: `src/components/OverlaySelector.jsx`
- Modify: `src/components/CaptureFlash.jsx`
- Modify: `src/components/Gallery.jsx`

**Step 1: Implement `OverlaySelector.jsx`**

```jsx
import { OVERLAYS } from '../config/overlays';

/**
 * Horizontal strip of emoji buttons to pick the active overlay.
 * Props:
 *   activeId  - id of currently active overlay
 *   onChange  - (overlay) => void
 */
export default function OverlaySelector({ activeId, onChange }) {
  return (
    <div className="flex gap-2 justify-center flex-wrap py-3 px-4">
      {OVERLAYS.map(overlay => (
        <button
          key={overlay.id}
          onClick={() => onChange(overlay)}
          title={overlay.label}
          className={`text-3xl p-2 rounded-xl transition-colors ${
            activeId === overlay.id
              ? 'bg-white/20 ring-2 ring-white'
              : 'bg-white/5 hover:bg-white/15'
          }`}
        >
          {overlay.emoji}
        </button>
      ))}
    </div>
  );
}
```

**Step 2: Implement `CaptureFlash.jsx`**

This component manages a brief visible flash when a photo is captured. The parent passes `triggered` (increments on each capture) and this component sets `flash=true` for one render cycle.

```jsx
import { useState, useEffect } from 'react';

/**
 * Returns { flash } - boolean true for ~100ms after each capture trigger.
 * Props: triggered (number, increments on each capture)
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
```

**Step 3: Implement `Gallery.jsx`**

```jsx
/**
 * Scrollable horizontal gallery of captured smile photos.
 * Props:
 *   photos      - [{ id, dataUrl, timestamp }]
 *   onClear     - () => void
 */
export default function Gallery({ photos, onClear }) {
  if (photos.length === 0) {
    return (
      <div className="text-center text-white/40 py-8 text-sm">
        Smile detected photos will appear here 📸
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/60 text-sm">{photos.length} smile{photos.length !== 1 ? 's' : ''} captured</span>
        <button
          onClick={onClear}
          className="text-white/40 hover:text-white/80 text-sm transition-colors"
        >
          Clear all
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {photos.map(photo => (
          <div key={photo.id} className="flex-shrink-0 relative group">
            <img
              src={photo.dataUrl}
              alt={`Smile at ${photo.timestamp}`}
              className="w-28 h-20 object-cover rounded-lg"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white/80 text-xs text-center py-0.5 rounded-b-lg">
              {photo.timestamp}
            </div>
            <a
              href={photo.dataUrl}
              download={`smile-${photo.timestamp}.jpg`}
              className="absolute top-1 right-1 bg-black/60 text-white/80 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              title="Download"
            >
              ⬇
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: OverlaySelector, Gallery, CaptureFlash components"
```

---

### Task 8: Wire everything together in `App.jsx`

**Files:**
- Modify: `src/App.jsx`
- Delete: `src/App.css` (not needed)

**Step 1: Clean up `src/App.jsx`**

Replace entirely with:

```jsx
import { useState, useCallback, useEffect } from 'react';
import useCamera from './hooks/useCamera';
import useSmileDetector from './hooks/useSmileDetector';
import useCapture from './hooks/useCapture';
import { useCaptureFlash } from './components/CaptureFlash';
import CameraCanvas from './components/CameraCanvas';
import OverlaySelector from './components/OverlaySelector';
import Gallery from './components/Gallery';
import { OVERLAYS } from './config/overlays';

// Hidden video element is rendered here, never shown to user
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

  const { videoRef, isReady, error, facingMode, toggleCamera, startCamera } = useCamera();
  const { photos, captureFromCanvas, clearPhotos } = useCapture();
  const flash = useCaptureFlash(captureCount);

  // Start camera on mount
  useEffect(() => { startCamera('user'); }, [startCamera]);

  // Called by useSmileDetector when smile is detected
  const handleSmile = useCallback((_landmarks, _blendshapes) => {
    setCaptureCount(c => c + 1);
  }, []);

  const { landmarks, isLoaded } = useSmileDetector(videoRef, isReady, handleSmile);

  // Capture canvas on each smile (captureCount change)
  const handleFrame = useCallback((canvasRef) => {
    // Capture is triggered by flash going true — we capture on the frame before flash
    // Actually: captureFromCanvas is called directly in handleSmile via a ref pattern
  }, []);

  // Better: capture directly when smile fires
  const canvasRef = { current: null }; // will be forwarded from CameraCanvas

  // We use a ref callback pattern to get canvas access in handleSmile
  const canvasRefInternal = useCallback((node) => {
    canvasRef.current = node;
  }, []);

  const handleSmileFinal = useCallback((lms, shapes) => {
    // Capture the current canvas frame
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
      photos; // access to avoid stale closure — captured via addPhoto below
    }
    setCaptureCount(c => c + 1);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <header className="text-center py-4 px-4">
        <h1 className="text-2xl font-bold text-white">Baby Smile Cam 📸</h1>
        {!isLoaded && (
          <p className="text-white/40 text-sm mt-1">Loading face detection...</p>
        )}
      </header>

      {/* Hidden video */}
      <HiddenVideo videoRef={videoRef} />

      {/* Error state */}
      {error && (
        <div className="mx-4 p-4 bg-red-900/40 rounded-xl text-red-300 text-sm text-center">
          {error}
        </div>
      )}

      {/* Camera canvas */}
      <div className="px-4 relative">
        <CameraCanvas
          videoRef={videoRef}
          landmarks={landmarks}
          activeOverlay={activeOverlay}
          flash={flash}
          onFrame={handleFrame}
        />
        {/* Camera toggle */}
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

      {/* Overlay selector */}
      <OverlaySelector activeId={activeOverlay.id} onChange={setActiveOverlay} />

      {/* Gallery */}
      <Gallery photos={photos} onClear={clearPhotos} />
    </div>
  );
}
```

> **Note:** The canvas capture approach needs a small refactor — the `CameraCanvas` ref needs to be forwarded. See Step 2.

**Step 2: Refactor CameraCanvas to forward canvas ref**

In `CameraCanvas.jsx`, add `forwardRef`:

```jsx
import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { drawMirroredVideo, drawEmojiOverlay } from '../utils/canvasUtils';

const CameraCanvas = forwardRef(function CameraCanvas(
  { videoRef, landmarks, activeOverlay, flash },
  ref
) {
  const canvasRef = useRef(null);

  // Expose canvas element to parent via ref
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
      if (landmarks && activeOverlay) {
        drawEmojiOverlay(ctx, landmarks, activeOverlay, W, H);
      }
      if (flash) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(0, 0, W, H);
      }
      rafId = requestAnimationFrame(draw);
    }
    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [videoRef, landmarks, activeOverlay, flash]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-xl"
      style={{ aspectRatio: '16/9', background: '#111' }}
    />
  );
});

export default CameraCanvas;
```

**Step 3: Final `App.jsx` — clean capture pattern**

Replace `App.jsx` entirely with this clean version:

```jsx
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
          className="absolute top-3 right-7 bg-black/50 text-white rounded-full p-2 text-lg hover:bg-black/70"
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
```

**Step 4: Delete `src/App.css`** (it is no longer imported anywhere)

**Step 5: Manual verification**

```bash
npm run dev
```

Open http://localhost:5173. Verify:
- [ ] Camera permission prompt appears
- [ ] Live video shows (mirrored)
- [ ] "Loading face detection..." appears then disappears
- [ ] "Face detected ✓" badge appears when face in frame
- [ ] Emoji overlay renders on face
- [ ] Switching overlays works
- [ ] Smiling triggers a flash + photo appears in gallery
- [ ] Download button works
- [ ] Clear all works
- [ ] Camera toggle switches cameras

**Step 6: Run all tests**

```bash
npm test -- --run
```
Expected: PASS (all tests)

**Step 7: Commit**

```bash
git add .
git commit -m "feat: wire App.jsx — complete Baby Smile Cam"
```

---

### Task 9: Final polish + push

**Files:**
- Modify: `README.md`
- Modify: `index.html` (update title)

**Step 1: Update `index.html` title**

Change `<title>Vite + React</title>` to `<title>Baby Smile Cam</title>`

**Step 2: Update `README.md`**

```markdown
# Baby Smile Cam 📸

A webcam app that detects your baby's face, shows fun emoji overlays, and auto-captures a photo when a smile is detected.

## Tech
- React + Vite
- Tailwind CSS v4
- MediaPipe FaceLandmarker (`@mediapipe/tasks-vision`)
- Canvas API

## Run locally
npm install
npm run dev

## Test
npm test
```

**Step 3: Push to GitHub**

```bash
git add .
git commit -m "chore: update readme + page title"
git push
```

---

## Manual Testing Checklist (final)

- [ ] Camera permission flow (grant + deny)
- [ ] Face detection loads (may take 2-3s on first load — WASM + model download)
- [ ] Overlays position correctly on face
- [ ] Smile triggers capture (not neutral face)
- [ ] 3s cooldown works (no burst captures)
- [ ] Gallery displays with timestamps
- [ ] Download saves file
- [ ] Clear all empties gallery
- [ ] Camera flip works (if device has both cameras)
- [ ] Responsive on mobile/tablet screen sizes
