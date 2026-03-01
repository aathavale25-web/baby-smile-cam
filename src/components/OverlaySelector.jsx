import { OVERLAYS } from '../config/overlays';

const PASTEL_BG = [
  'bg-sky-100',
  'bg-violet-100',
  'bg-pink-100',
  'bg-emerald-100',
  'bg-amber-100',
  'bg-orange-100',
];

/**
 * Horizontal strip of clay overlay buttons showing image previews.
 * Props:
 *   activeId      - id of currently active overlay
 *   overlayImages - map of { [id]: HTMLImageElement }
 *   onChange      - (overlay) => void
 */
export default function OverlaySelector({ activeId, overlayImages, onChange }) {
  return (
    <div className="flex gap-3 justify-center flex-wrap">
      {OVERLAYS.map((overlay, i) => {
        const img = overlayImages?.[overlay.id];
        const isActive = activeId === overlay.id;
        return (
          <button
            key={overlay.id}
            onClick={() => onChange(overlay)}
            title={overlay.label}
            aria-label={overlay.label}
            aria-pressed={isActive}
            className={[
              'clay-btn w-16 h-16 flex items-center justify-center transition-all duration-200',
              PASTEL_BG[i % PASTEL_BG.length],
              isActive
                ? 'scale-110 ring-[3px] ring-sky-400 ring-offset-2'
                : 'hover:scale-105',
            ].join(' ')}
          >
            {img ? (
              <img
                src={img.src}
                alt={overlay.label}
                className="w-10 h-10 object-contain drop-shadow-sm"
              />
            ) : (
              <span className="w-10 h-10 rounded-full bg-white/50 animate-pulse block" />
            )}
          </button>
        );
      })}
    </div>
  );
}
