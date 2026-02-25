const BASE = 'https://cdn.jsdelivr.net/gh/hfg-gmuend/openmoji/color/svg';

/**
 * Overlay configuration using OpenMoji SVGs (CC BY-SA 4.0).
 * anchor:       MediaPipe landmark index to anchor the image
 * offsetYRatio: vertical offset as fraction of faceWidth (negative = up)
 * sizeRatio:    image width as fraction of faceWidth
 */
export const OVERLAYS = [
  {
    id: 'crown',
    label: 'Crown',
    imageUrl: `${BASE}/1F451.svg`,
    anchor: 10,         // forehead top
    offsetYRatio: -0.65,
    sizeRatio: 1.1,
  },
  {
    id: 'rainbow',
    label: 'Rainbow',
    imageUrl: `${BASE}/1F308.svg`,
    anchor: 10,         // forehead top
    offsetYRatio: -1.3,
    sizeRatio: 2.0,
  },
  {
    id: 'bunny',
    label: 'Bunny',
    imageUrl: `${BASE}/1F430.svg`,
    anchor: 10,         // forehead top
    offsetYRatio: -0.8,
    sizeRatio: 1.2,
  },
  {
    id: 'butterfly',
    label: 'Butterfly',
    imageUrl: `${BASE}/1F98B.svg`,
    anchor: 168,        // nose bridge
    offsetYRatio: -0.1,
    sizeRatio: 0.9,
  },
  {
    id: 'ribbon',
    label: 'Bow',
    imageUrl: `${BASE}/1F380.svg`,
    anchor: 10,         // forehead top
    offsetYRatio: -0.55,
    sizeRatio: 1.0,
  },
  {
    id: 'sunflower',
    label: 'Sunflower',
    imageUrl: `${BASE}/1F33B.svg`,
    anchor: 10,         // forehead top
    offsetYRatio: -0.5,
    sizeRatio: 0.85,
  },
];
