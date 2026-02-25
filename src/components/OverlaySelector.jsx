import { OVERLAYS } from '../config/overlays';

/**
 * Horizontal strip of overlay buttons showing image previews.
 * Props:
 *   activeId      - id of currently active overlay
 *   overlayImages - map of { [id]: HTMLImageElement }
 *   onChange      - (overlay) => void
 */
export default function OverlaySelector({ activeId, overlayImages, onChange }) {
  return (
    <div className="flex gap-2 justify-center flex-wrap py-3 px-4">
      {OVERLAYS.map(overlay => {
        const img = overlayImages?.[overlay.id];
        return (
          <button
            key={overlay.id}
            onClick={() => onChange(overlay)}
            title={overlay.label}
            className={`w-14 h-14 p-1.5 rounded-xl transition-colors flex items-center justify-center ${
              activeId === overlay.id
                ? 'bg-white/20 ring-2 ring-white'
                : 'bg-white/5 hover:bg-white/15'
            }`}
          >
            {img ? (
              <img src={img.src} alt={overlay.label} className="w-full h-full object-contain" />
            ) : (
              <span className="text-white/30 text-xs">...</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
