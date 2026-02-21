import { useState, useMemo } from 'react'

const STATUS_CONFIG = {
  AVAILABLE: {
    bg: 'bg-klee-available',
    text: 'text-klee-bg',
    border: 'border-klee-available',
    label: 'AVAILABLE'
  },
  TAKEN: {
    bg: 'bg-klee-taken',
    text: 'text-klee-text',
    border: 'border-klee-taken',
    label: 'TAKEN'
  },
  ERROR: {
    bg: 'bg-klee-error',
    text: 'text-klee-bg',
    border: 'border-klee-error',
    label: 'ERROR'
  }
}

export default function ResultsTable({
  results = [],
  selectedIds = [],
  onSelectionChange,
  onDelete
}) {
  const [statusFilter, setStatusFilter] = useState('')
  const [tldFilter, setTldFilter] = useState('')
  const [searchFilter, setSearchFilter] = useState('')

  const safeResults = Array.isArray(results) ? results : []
  const safeSelectedIds = Array.isArray(selectedIds) ? selectedIds : []

  const tlds = useMemo(() => {
    const set = new Set(safeResults.map(r => r.tld))
    return Array.from(set).sort()
  }, [safeResults])

  const filtered = useMemo(() => {
    return safeResults.filter(r => {
      if (statusFilter && r.status !== statusFilter) return false
      if (tldFilter && r.tld !== tldFilter) return false
      if (searchFilter && !r.domain?.toLowerCase().includes(searchFilter.toLowerCase())) return false
      return true
    })
  }, [safeResults, statusFilter, tldFilter, searchFilter])

  const toggleSelection = (id) => {
    if (safeSelectedIds.includes(id)) {
      onSelectionChange(safeSelectedIds.filter(i => i !== id))
    } else {
      onSelectionChange([...safeSelectedIds, id])
    }
  }

  const toggleAll = () => {
    if (safeSelectedIds.length === filtered.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(filtered.map(r => r.id))
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (safeResults.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 bg-klee-muted opacity-20" />
        <p className="text-klee-muted font-heading tracking-wider">
          NO RESULTS YET
        </p>
        <p className="text-klee-muted text-sm mt-2 font-mono">
          Check some domains to get started
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-semibold text-klee-text tracking-wide">
        RESULTS
      </h2>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Search domains..."
          className="px-4 py-3 bg-klee-bg border-2 border-klee-muted text-klee-text font-mono text-sm focus:border-klee-accent placeholder-klee-muted"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
        />
        <select
          className="px-4 py-3 bg-klee-bg border-2 border-klee-muted text-klee-text font-mono text-sm focus:border-klee-accent"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">ALL STATUSES</option>
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="TAKEN">TAKEN</option>
          <option value="ERROR">ERROR</option>
        </select>
        <select
          className="px-4 py-3 bg-klee-bg border-2 border-klee-muted text-klee-text font-mono text-sm focus:border-klee-accent"
          value={tldFilter}
          onChange={(e) => setTldFilter(e.target.value)}
        >
          <option value="">ALL TLDS</option>
          {tlds.map(tld => (
            <option key={tld} value={tld}>.{tld}</option>
          ))}
        </select>
      </div>

      {/* Count */}
      <div className="text-sm text-klee-muted font-mono">
        Showing <span className="text-klee-text">{filtered.length}</span> of <span className="text-klee-text">{safeResults.length}</span>
        {safeSelectedIds.length > 0 && (
          <span className="ml-3 text-klee-accent">
            ({safeSelectedIds.length} selected)
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto border-2 border-klee-muted">
        <table className="w-full">
          <thead>
            <tr className="bg-klee-bg border-b-2 border-klee-muted">
              <th className="px-4 py-4 text-left">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && safeSelectedIds.length === filtered.length}
                  onChange={toggleAll}
                />
              </th>
              <th className="px-4 py-4 text-left text-xs font-heading font-semibold text-klee-muted tracking-widest">
                DOMAIN
              </th>
              <th className="px-4 py-4 text-left text-xs font-heading font-semibold text-klee-muted tracking-widest">
                STATUS
              </th>
              <th className="px-4 py-4 text-left text-xs font-heading font-semibold text-klee-muted tracking-widest hidden md:table-cell">
                REGISTRAR
              </th>
              <th className="px-4 py-4 text-left text-xs font-heading font-semibold text-klee-muted tracking-widest hidden md:table-cell">
                EXPIRY
              </th>
              <th className="px-4 py-4 text-left text-xs font-heading font-semibold text-klee-muted tracking-widest hidden lg:table-cell">
                CHECKED
              </th>
              <th className="px-4 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((result, index) => {
              const config = STATUS_CONFIG[result.status] || STATUS_CONFIG.ERROR
              const key = result.id || result.domain || index
              return (
                <tr
                  key={key}
                  className={`border-b border-klee-muted hover:bg-klee-bg transition-colors ${
                    index % 2 === 0 ? 'bg-klee-surface' : 'bg-klee-surface/50'
                  }`}
                >
                  <td className="px-4 py-4">
                    {result.id ? (
                      <input
                        type="checkbox"
                        checked={safeSelectedIds.includes(result.id)}
                        onChange={() => toggleSelection(result.id)}
                      />
                    ) : (
                      <span className="text-klee-muted text-xs">•••</span>
                    )}
                  </td>
                  <td className="px-4 py-4 font-mono text-sm text-klee-text">
                    {result.domain}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-block px-3 py-1 text-xs font-heading font-semibold tracking-wider ${config.bg} ${config.text}`}>
                      {config.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-klee-muted font-mono hidden md:table-cell">
                    {result.registrar || '—'}
                  </td>
                  <td className="px-4 py-4 text-sm text-klee-muted font-mono hidden md:table-cell">
                    {result.expiry || '—'}
                  </td>
                  <td className="px-4 py-4 text-sm text-klee-muted font-mono hidden lg:table-cell">
                    {formatDate(result.checked_at)}
                  </td>
                  <td className="px-4 py-4">
                    {result.id ? (
                      <button
                        onClick={() => onDelete(result.id)}
                        className="text-klee-taken hover:text-klee-accent text-sm font-heading tracking-wider transition-colors"
                      >
                        DELETE
                      </button>
                    ) : null}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
