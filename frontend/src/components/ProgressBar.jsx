export default function ProgressBar({ current, total }) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0
  const segments = 20
  const filledSegments = Math.round((current / total) * segments) || 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="font-heading text-klee-text tracking-wider text-sm">
          CHECKING DOMAINS
        </span>
        <span className="font-mono text-klee-accent text-sm">
          {current} / {total}
        </span>
      </div>

      {/* Segmented Progress Bar - Bauhaus style */}
      <div className="flex gap-1">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`h-6 flex-1 transition-colors duration-150 ${
              i < filledSegments
                ? i % 3 === 0
                  ? 'bg-klee-accent'
                  : i % 3 === 1
                  ? 'bg-klee-available'
                  : 'bg-klee-error'
                : 'bg-klee-bg border border-klee-muted'
            }`}
          />
        ))}
      </div>

      {/* Percentage */}
      <div className="text-center">
        <span className="font-mono text-klee-muted text-lg">
          {percentage}%
        </span>
        <span className="text-klee-muted text-sm ml-2 font-heading tracking-wider">
          COMPLETE
        </span>
      </div>
    </div>
  )
}
