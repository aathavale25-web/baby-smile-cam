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
 * Draw a PNG/SVG overlay anchored to a face landmark.
 * Image x is mirrored to match the mirrored video.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} landmarks - normalized landmarks array
 * @param {object} overlay - overlay config from OVERLAYS
 * @param {Object} overlayImages - map of { [id]: HTMLImageElement }
 * @param {number} W - canvas width
 * @param {number} H - canvas height
 */
export function drawImageOverlay(ctx, landmarks, overlay, overlayImages, W, H) {
  const img = overlayImages[overlay.id];
  if (!img) return;

  const fw = faceWidth(landmarks, W);
  const drawW = Math.max(60, fw * overlay.sizeRatio);

  // Preserve the image's natural aspect ratio
  const aspect = img.naturalWidth > 0 ? img.naturalWidth / img.naturalHeight : 1;
  const drawH = drawW / aspect;

  const { x, y } = getLandmarkPx(landmarks, overlay.anchor, W, H);
  const mirroredX = W - x;
  const offsetY = fw * overlay.offsetYRatio;

  ctx.drawImage(img, mirroredX - drawW / 2, y + offsetY - drawH / 2, drawW, drawH);
}
