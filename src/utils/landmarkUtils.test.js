import { getLandmarkPx, faceWidth, faceHeight } from './landmarkUtils';

const mockLandmarks = Array(468).fill({ x: 0.5, y: 0.5, z: 0 });
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
    expect(faceWidth(landmarks, W)).toBeCloseTo(384, 5); // (0.8 - 0.2) * 640
  });
});

describe('faceHeight', () => {
  it('returns pixel distance from forehead to chin', () => {
    expect(faceHeight(landmarks, H)).toBe(384); // (0.9 - 0.1) * 480
  });
});
