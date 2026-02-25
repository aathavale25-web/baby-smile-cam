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
