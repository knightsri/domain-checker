import { useState } from 'react'

// Valid domain: alphanumeric, hyphens, dots only. No spaces or special chars.
const isValidDomain = (domain) => {
  if (!domain || domain.length === 0) return false
  // Must match: letters, numbers, hyphens, and dots only
  // Cannot start or end with hyphen or dot
  // No consecutive dots
  const pattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i
  return pattern.test(domain) && domain.length <= 253
}

export default function DomainInput({ onDomainsChange, disabled }) {
  const [activeTab, setActiveTab] = useState('text')
  const [textInput, setTextInput] = useState('')
  const [domains, setDomains] = useState([])
  const [invalidDomains, setInvalidDomains] = useState([])

  const parseInput = (text) => {
    const lines = text.split('\n')
    const valid = []
    const invalid = []

    lines.forEach(line => {
      // Clean the input: trim whitespace, convert to lowercase
      const cleaned = line.trim().toLowerCase()

      // Skip empty lines and comments
      if (!cleaned || cleaned.startsWith('#')) return

      // Remove any spaces within the domain
      const noSpaces = cleaned.replace(/\s+/g, '')

      if (isValidDomain(noSpaces)) {
        valid.push(noSpaces)
      } else if (noSpaces) {
        invalid.push(cleaned)
      }
    })

    setDomains(valid)
    setInvalidDomains(invalid)
    onDomainsChange(valid)
  }

  const handleTextChange = (e) => {
    setTextInput(e.target.value)
    parseInput(e.target.value)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result || ''
      setTextInput(text)
      parseInput(text)
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-semibold text-klee-text tracking-wide">
        DOMAIN INPUT
      </h2>

      {/* Tab Buttons */}
      <div className="flex gap-2">
        <button
          className={`px-4 py-2 text-sm font-heading tracking-wider transition-colors ${
            activeTab === 'text'
              ? 'bg-klee-accent text-klee-text'
              : 'bg-klee-bg text-klee-muted border-2 border-klee-muted hover:border-klee-text'
          }`}
          onClick={() => setActiveTab('text')}
        >
          TEXT INPUT
        </button>
        <button
          className={`px-4 py-2 text-sm font-heading tracking-wider transition-colors ${
            activeTab === 'file'
              ? 'bg-klee-accent text-klee-text'
              : 'bg-klee-bg text-klee-muted border-2 border-klee-muted hover:border-klee-text'
          }`}
          onClick={() => setActiveTab('file')}
        >
          FILE UPLOAD
        </button>
      </div>

      {/* Text Input */}
      {activeTab === 'text' ? (
        <textarea
          className="w-full h-48 p-4 bg-klee-bg border-2 border-klee-muted text-klee-text font-mono text-sm focus:border-klee-accent placeholder-klee-muted"
          placeholder="Enter domains, one per line:&#10;shalusri&#10;mydomain.com&#10;example"
          value={textInput}
          onChange={handleTextChange}
          disabled={disabled}
        />
      ) : (
        <div className="border-2 border-dashed border-klee-muted p-12 text-center hover:border-klee-accent transition-colors">
          <input
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
            disabled={disabled}
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-klee-accent flex items-center justify-center">
              <svg className="w-8 h-8 text-klee-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="square" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <span className="text-klee-text font-heading tracking-wider">
              CLICK TO UPLOAD .TXT FILE
            </span>
            <p className="text-klee-muted text-sm mt-2 font-mono">
              One domain per line. Lines starting with # are ignored.
            </p>
          </label>
        </div>
      )}

      {/* Invalid Domains Warning */}
      {invalidDomains.length > 0 && (
        <div className="bg-klee-bg border-l-4 border-klee-taken p-4">
          <p className="text-sm font-heading text-klee-taken mb-3 tracking-wider">
            {invalidDomains.length} INVALID DOMAIN{invalidDomains.length !== 1 ? 'S' : ''} SKIPPED
          </p>
          <div className="flex flex-wrap gap-2 max-h-16 overflow-y-auto">
            {invalidDomains.slice(0, 10).map((domain, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-klee-surface border-l-2 border-klee-taken text-klee-muted font-mono text-sm line-through"
              >
                {domain}
              </span>
            ))}
            {invalidDomains.length > 10 && (
              <span className="px-3 py-1 text-klee-muted text-sm font-mono">
                +{invalidDomains.length - 10} more
              </span>
            )}
          </div>
          <p className="text-xs text-klee-muted mt-2 font-mono">
            Domains can only contain letters, numbers, hyphens, and dots
          </p>
        </div>
      )}

      {/* Parsed Domains Preview */}
      {domains.length > 0 && (
        <div className="bg-klee-bg border-l-4 border-klee-available p-4">
          <p className="text-sm font-heading text-klee-available mb-3 tracking-wider">
            {domains.length} VALID DOMAIN{domains.length !== 1 ? 'S' : ''}
          </p>
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
            {domains.slice(0, 20).map((domain, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-klee-surface border-l-2 border-klee-available text-klee-text font-mono text-sm"
              >
                {domain}
              </span>
            ))}
            {domains.length > 20 && (
              <span className="px-3 py-1 text-klee-muted text-sm font-mono">
                +{domains.length - 20} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
