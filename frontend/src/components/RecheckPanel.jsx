export default function RecheckPanel({
  selectedIds = [],
  availableCount,
  onRecheckSelected,
  onRecheckAvailable,
  onDeleteSelected,
  disabled
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={onRecheckAvailable}
        disabled={disabled || availableCount === 0}
        className="px-4 py-3 bg-klee-available text-klee-bg font-heading text-sm tracking-wider hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        RECHECK ALL AVAILABLE ({availableCount})
      </button>

      <button
        onClick={onRecheckSelected}
        disabled={disabled || selectedIds.length === 0}
        className="px-4 py-3 bg-klee-accent text-klee-text font-heading text-sm tracking-wider hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        RECHECK SELECTED ({selectedIds.length})
      </button>

      <button
        onClick={onDeleteSelected}
        disabled={disabled || selectedIds.length === 0}
        className="px-4 py-3 bg-klee-taken text-klee-text font-heading text-sm tracking-wider hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        DELETE SELECTED ({selectedIds.length})
      </button>
    </div>
  )
}
