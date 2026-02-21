import { useState, useEffect } from 'react'
import DomainInput from './components/DomainInput'
import TldSelector from './components/TldSelector'
import ProgressBar from './components/ProgressBar'
import ResultsTable from './components/ResultsTable'
import RecheckPanel from './components/RecheckPanel'
import {
  checkDomains,
  recheckDomains,
  getResults,
  deleteResult,
  deleteResults,
  exportCsv
} from './api'

export default function App() {
  const [domains, setDomains] = useState([])
  const [tlds, setTlds] = useState(['com'])
  const [results, setResults] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [isChecking, setIsChecking] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [activeTab, setActiveTab] = useState('input')

  useEffect(() => {
    loadResults()
  }, [])

  const loadResults = async () => {
    try {
      const data = await getResults()
      setResults(data)
    } catch (err) {
      console.error('Failed to load results:', err)
    }
  }

  const handleCheck = async () => {
    if (domains.length === 0) return

    setIsChecking(true)
    setProgress({ current: 0, total: 0 })
    setActiveTab('results')

    try {
      await checkDomains(
        domains,
        tlds,
        (current, total) => setProgress({ current, total }),
        (result) => {
          setResults(prev => {
            const existing = prev.findIndex(r => r.domain === result.domain)
            if (existing >= 0) {
              const updated = [...prev]
              updated[existing] = { ...updated[existing], ...result }
              return updated
            }
            return [result, ...prev]
          })
        }
      )
    } catch (err) {
      console.error('Check failed:', err)
    } finally {
      setIsChecking(false)
      await loadResults()
    }
  }

  const handleRecheckAvailable = async () => {
    setIsChecking(true)
    setProgress({ current: 0, total: 0 })

    try {
      await recheckDomains(
        [],
        (current, total) => setProgress({ current, total }),
        (result) => {
          setResults(prev => {
            const existing = prev.findIndex(r => r.domain === result.domain)
            if (existing >= 0) {
              const updated = [...prev]
              updated[existing] = { ...updated[existing], ...result }
              return updated
            }
            return prev
          })
        }
      )
    } catch (err) {
      console.error('Recheck failed:', err)
    } finally {
      setIsChecking(false)
      await loadResults()
    }
  }

  const handleRecheckSelected = async () => {
    if (selectedIds.length === 0) return

    setIsChecking(true)
    setProgress({ current: 0, total: 0 })

    try {
      await recheckDomains(
        selectedIds,
        (current, total) => setProgress({ current, total }),
        (result) => {
          setResults(prev => {
            const existing = prev.findIndex(r => r.domain === result.domain)
            if (existing >= 0) {
              const updated = [...prev]
              updated[existing] = { ...updated[existing], ...result }
              return updated
            }
            return prev
          })
        }
      )
    } catch (err) {
      console.error('Recheck failed:', err)
    } finally {
      setIsChecking(false)
      setSelectedIds([])
      await loadResults()
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteResult(id)
      setResults(prev => prev.filter(r => r.id !== id))
      setSelectedIds(prev => prev.filter(i => i !== id))
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return

    try {
      await deleteResults(selectedIds)
      setResults(prev => prev.filter(r => !selectedIds.includes(r.id)))
      setSelectedIds([])
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const handleCopyAvailable = () => {
    const available = results
      .filter(r => r.status === 'AVAILABLE')
      .map(r => r.domain)
      .join('\n')
    navigator.clipboard.writeText(available)
  }

  const availableCount = results.filter(r => r.status === 'AVAILABLE').length

  return (
    <div className="min-h-screen bg-klee-bg">
      {/* Header */}
      <header className="bg-klee-surface border-b-4 border-klee-accent">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-klee-accent flex items-center justify-center">
              <svg className="w-8 h-8 text-klee-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <path strokeWidth="2" d="M12 2v20M2 12h20M12 2c-2.5 3-4 6.5-4 10s1.5 7 4 10M12 2c2.5 3 4 6.5 4 10s-1.5 7-4 10"/>
              </svg>
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold text-klee-text tracking-wide">
                DOMAIN CHECKER
              </h1>
              <p className="text-klee-muted text-sm tracking-widest uppercase">
                Bulk Availability Scanner
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex mb-8">
          <button
            className={`px-6 py-3 font-heading font-semibold text-sm tracking-widest border-b-4 transition-colors ${
              activeTab === 'input'
                ? 'bg-klee-surface text-klee-text border-klee-accent'
                : 'bg-klee-bg text-klee-muted border-klee-surface hover:text-klee-text'
            }`}
            onClick={() => setActiveTab('input')}
          >
            CHECK DOMAINS
          </button>
          <button
            className={`px-6 py-3 font-heading font-semibold text-sm tracking-widest border-b-4 transition-colors ${
              activeTab === 'results'
                ? 'bg-klee-surface text-klee-text border-klee-accent'
                : 'bg-klee-bg text-klee-muted border-klee-surface hover:text-klee-text'
            }`}
            onClick={() => setActiveTab('results')}
          >
            RESULTS ({results.length})
          </button>
          <div className="flex-1 border-b-4 border-klee-surface" />
        </div>

        {/* Input Tab */}
        {activeTab === 'input' && (
          <div className="grid gap-6">
            <div className="bg-klee-surface border-l-4 border-klee-accent p-6">
              <DomainInput
                onDomainsChange={setDomains}
                disabled={isChecking}
              />
            </div>

            <div className="bg-klee-surface border-l-4 border-klee-available p-6">
              <TldSelector
                onTldsChange={setTlds}
                domainCount={domains.length}
                disabled={isChecking}
              />
            </div>

            <button
              onClick={handleCheck}
              disabled={isChecking || domains.length === 0}
              className="w-full py-4 bg-klee-accent text-klee-text font-heading font-bold text-lg tracking-widest hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isChecking ? 'CHECKING...' : 'CHECK AVAILABILITY'}
            </button>

            {isChecking && (
              <div className="bg-klee-surface border-l-4 border-klee-error p-6">
                <ProgressBar current={progress.current} total={progress.total} />
              </div>
            )}
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="grid gap-6">
            {isChecking && (
              <div className="bg-klee-surface border-l-4 border-klee-error p-6">
                <ProgressBar current={progress.current} total={progress.total} />
              </div>
            )}

            <div className="bg-klee-surface border-l-4 border-klee-accent p-6">
              <div className="flex flex-wrap gap-3 mb-6">
                <button
                  onClick={exportCsv}
                  disabled={results.length === 0}
                  className="px-4 py-2 bg-klee-bg border-2 border-klee-muted text-klee-text text-sm hover:border-klee-accent disabled:opacity-50 transition-colors"
                >
                  EXPORT CSV
                </button>
                <button
                  onClick={handleCopyAvailable}
                  disabled={availableCount === 0}
                  className="px-4 py-2 bg-klee-bg border-2 border-klee-muted text-klee-text text-sm hover:border-klee-available disabled:opacity-50 transition-colors"
                >
                  COPY AVAILABLE ({availableCount})
                </button>
              </div>

              <RecheckPanel
                selectedIds={selectedIds}
                availableCount={availableCount}
                onRecheckSelected={handleRecheckSelected}
                onRecheckAvailable={handleRecheckAvailable}
                onDeleteSelected={handleDeleteSelected}
                disabled={isChecking}
              />
            </div>

            <div className="bg-klee-surface border-l-4 border-klee-available p-6">
              <ResultsTable
                results={results}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onDelete={handleDelete}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-klee-surface mt-12">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <p className="text-klee-muted text-xs tracking-widest text-center">
            RDAP POWERED • NO API KEY REQUIRED
          </p>
        </div>
      </footer>
    </div>
  )
}
