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
