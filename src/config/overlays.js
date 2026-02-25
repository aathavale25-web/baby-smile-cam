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
