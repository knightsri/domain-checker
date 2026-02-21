import { useState, useEffect } from 'react'

const DEFAULT_TLDS = ['com', 'io', 'ai', 'co', 'net', 'org', 'dev', 'app', 'xyz']

export default function TldSelector({ onTldsChange, domainCount, disabled }) {
  const [selected, setSelected] = useState(['com'])
  const [custom, setCustom] = useState('')

  useEffect(() => {
    const allTlds = [...selected]
    if (custom.trim()) {
      const customTlds = custom.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
      allTlds.push(...customTlds)
    }
    onTldsChange([...new Set(allTlds)])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, custom])

  const toggleTld = (tld) => {
    setSelected(prev =>
      prev.includes(tld) ? prev.filter(t => t !== tld) : [...prev, tld]
    )
  }

  const totalTlds = selected.length + (custom.trim() ? custom.split(',').filter(t => t.trim()).length : 0)
  const totalLookups = domainCount * totalTlds

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-semibold text-klee-text tracking-wide">
        TLD SELECTION
      </h2>

      {/* TLD Grid - Bauhaus style */}
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
        {DEFAULT_TLDS.map(tld => (
          <button
            key={tld}
            onClick={() => toggleTld(tld)}
            disabled={disabled}
            className={`py-3 text-sm font-mono font-semibold transition-colors ${
              selected.includes(tld)
                ? 'bg-klee-accent text-klee-text'
                : 'bg-klee-bg border-2 border-klee-muted text-klee-muted hover:border-klee-text hover:text-klee-text'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            .{tld}
          </button>
        ))}
      </div>

      {/* Custom TLDs */}
      <div>
        <label className="block text-sm text-klee-muted mb-2 font-heading tracking-wider">
          CUSTOM TLDS
        </label>
        <input
          type="text"
          className="w-full px-4 py-3 bg-klee-bg border-2 border-klee-muted text-klee-text font-mono text-sm focus:border-klee-accent placeholder-klee-muted"
          placeholder="tech, cloud, pro"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          disabled={disabled}
        />
      </div>

      {/* Summary */}
      {domainCount > 0 && totalTlds > 0 && (
        <div className="bg-klee-bg border-l-4 border-klee-available p-4">
          <p className="text-klee-text font-mono text-sm">
            <span className="text-klee-available font-bold">{domainCount}</span> domain{domainCount !== 1 ? 's' : ''} ×
            <span className="text-klee-available font-bold ml-1">{totalTlds}</span> TLD{totalTlds !== 1 ? 's' : ''} =
            <span className="text-klee-accent font-bold ml-1">{totalLookups}</span> lookups
          </p>
        </div>
      )}

      {/* Warning for large batches */}
      {totalLookups > 200 && (
        <div className="bg-klee-bg border-l-4 border-klee-error p-4">
          <p className="text-klee-error font-heading text-sm tracking-wider">
            LARGE BATCH DETECTED — THIS MAY TAKE A WHILE
          </p>
        </div>
      )}
    </div>
  )
}
