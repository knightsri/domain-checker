import { useState, useEffect } from 'react'
import { getKnownTlds } from '../api'

const DEFAULT_TLDS = ['com', 'io', 'ai', 'co', 'net', 'org', 'dev', 'app', 'xyz']

// Valid TLD: 2-63 chars, alphanumeric only
const isValidTld = (tld) => {
  if (!tld || tld.length < 2 || tld.length > 63) return false
  return /^[a-z0-9]+$/i.test(tld)
}

export default function TldSelector({ onTldsChange, domainCount, disabled }) {
  const [selected, setSelected] = useState(['com'])
  const [custom, setCustom] = useState('')
  const [invalidTlds, setInvalidTlds] = useState([])
  const [unknownTlds, setUnknownTlds] = useState([])
  const [knownTlds, setKnownTlds] = useState(new Set())
  const [tldsLoaded, setTldsLoaded] = useState(false)

  // Fetch known TLDs from IANA via backend
  useEffect(() => {
    getKnownTlds().then(tlds => {
      if (tlds.length > 0) {
        setKnownTlds(new Set(tlds.map(t => t.toLowerCase())))
      }
      setTldsLoaded(true)
    })
  }, [])

  const isKnownTld = (tld) => knownTlds.has(tld.toLowerCase())

  useEffect(() => {
    const allTlds = [...selected]
    const invalid = []
    const unknown = []

    if (custom.trim()) {
      const customTlds = custom.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
      customTlds.forEach(tld => {
        if (!isValidTld(tld)) {
          invalid.push(tld)
        } else if (tldsLoaded && !isKnownTld(tld)) {
          unknown.push(tld)
          allTlds.push(tld) // Still add unknown but valid TLDs
        } else {
          allTlds.push(tld)
        }
      })
    }

    setInvalidTlds(invalid)
    setUnknownTlds(unknown)
    onTldsChange([...new Set(allTlds)])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, custom, knownTlds, tldsLoaded])

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

      {/* Unknown TLDs Warning */}
      {unknownTlds.length > 0 && (
        <div className="bg-klee-bg border-l-4 border-klee-error p-4">
          <p className="text-klee-error font-heading text-sm tracking-wider mb-2">
            UNKNOWN TLD{unknownTlds.length !== 1 ? 'S' : ''} — RESULTS MAY BE MISLEADING
          </p>
          <div className="flex flex-wrap gap-2">
            {unknownTlds.map((tld, i) => (
              <span key={i} className="px-2 py-1 bg-klee-surface border-l-2 border-klee-error text-klee-error font-mono text-sm">
                .{tld}
              </span>
            ))}
          </div>
          <p className="text-xs text-klee-muted mt-2 font-mono">
            These TLDs are not recognized. RDAP may return "available" for non-existent TLDs.
          </p>
        </div>
      )}

      {/* Invalid TLDs Warning */}
      {invalidTlds.length > 0 && (
        <div className="bg-klee-bg border-l-4 border-klee-taken p-4">
          <p className="text-klee-taken font-heading text-sm tracking-wider mb-2">
            INVALID TLD{invalidTlds.length !== 1 ? 'S' : ''} SKIPPED
          </p>
          <div className="flex flex-wrap gap-2">
            {invalidTlds.map((tld, i) => (
              <span key={i} className="px-2 py-1 bg-klee-surface border-l-2 border-klee-taken text-klee-muted font-mono text-sm line-through">
                .{tld}
              </span>
            ))}
          </div>
          <p className="text-xs text-klee-muted mt-2 font-mono">
            TLDs must be 2-63 characters, letters and numbers only
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
