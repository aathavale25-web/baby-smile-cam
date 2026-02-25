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
