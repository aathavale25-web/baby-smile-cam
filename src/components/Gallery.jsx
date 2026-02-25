/**
 * Scrollable horizontal gallery of captured smile photos.
 * Props:
 *   photos  - [{ id, dataUrl, timestamp }]
 *   onClear - () => void
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
        <span className="text-white/60 text-sm">
          {photos.length} smile{photos.length !== 1 ? 's' : ''} captured
        </span>
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
