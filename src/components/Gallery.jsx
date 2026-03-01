function DownloadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-amber-400" aria-hidden="true">
      <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5Z" clipRule="evenodd" />
    </svg>
  );
}

/**
 * Scrollable gallery of captured smile photos.
 * Props:
 *   photos  - [{ id, dataUrl, timestamp }]
 *   onClear - () => void
 */
export default function Gallery({ photos, onClear }) {
  if (photos.length === 0) {
    return (
      <div
        className="clay-card p-8 text-center"
        style={{ background: 'linear-gradient(135deg, #fdf4ff, #fce7f3)' }}
      >
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 rounded-[16px] bg-pink-100 border-[3px] border-white shadow-md flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-pink-400" aria-hidden="true">
              <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
              <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM6.75 12.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Zm12-1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <p className="font-display text-pink-700 text-xl font-semibold">No smiles yet!</p>
        <p className="text-pink-400 text-sm mt-1 font-medium">
          Smile at the camera and I&apos;ll capture it automatically
        </p>
      </div>
    );
  }

  return (
    <div
      className="clay-card p-4"
      style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <SparkleIcon />
          <span className="font-display text-amber-700 text-xl font-semibold">
            {photos.length} smile{photos.length !== 1 ? 's' : ''} captured
          </span>
        </div>
        <button
          onClick={onClear}
          className="clay-btn bg-rose-100 text-rose-500 hover:text-rose-600 text-sm font-bold px-3 py-1.5 hover:bg-rose-200 transition-colors"
          aria-label="Clear all photos"
          style={{ borderColor: 'rgba(255,255,255,0.8)' }}
        >
          Clear all
        </button>
      </div>

      {/* Scrollable photos row */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {photos.map(photo => (
          <div
            key={photo.id}
            className="flex-shrink-0 relative group"
            style={{
              borderRadius: 16,
              overflow: 'hidden',
              border: '3px solid rgba(255,255,255,0.9)',
              boxShadow: '3px 3px 0px rgba(251,191,36,0.25), inset -1px -1px 6px rgba(0,0,0,0.04)',
              width: 112,
            }}
          >
            <img
              src={photo.dataUrl}
              alt={`Smile captured at ${photo.timestamp}`}
              className="w-28 h-20 object-cover block"
            />
            {/* Timestamp */}
            <div className="absolute bottom-0 left-0 right-0 bg-amber-900/60 text-amber-50 text-xs text-center py-1 font-semibold">
              {photo.timestamp}
            </div>
            {/* Download button — visible on hover */}
            <a
              href={photo.dataUrl}
              download={`smile-${photo.timestamp}.jpg`}
              className="clay-btn absolute top-1.5 right-1.5 bg-white/90 text-sky-600 p-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              aria-label={`Download photo taken at ${photo.timestamp}`}
              style={{ borderColor: 'rgba(255,255,255,0.9)' }}
              onClick={e => e.stopPropagation()}
            >
              <DownloadIcon />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
