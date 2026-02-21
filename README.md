# Domain Checker

Bulk domain availability checker with persistent results and recheck workflow.

## Quick Start

```bash
docker-compose up -d
```

Open http://localhost in your browser.

## Features

- Bulk domain checking via RDAP API (free, no API key needed)
- TLD expansion (check `mydomain` against `.com`, `.io`, `.ai`, etc.)
- TLD validation against IANA's authoritative list (warns on unknown TLDs)
- Domain name validation (rejects invalid characters, spaces, etc.)
- Persistent results in SQLite
- Recheck available domains with one click
- CSV export
- PWA — installable on desktop and mobile
- Mobile-friendly responsive design
- Bauhaus/Paul Klee inspired UI theme

## Local Development

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at http://localhost:8000

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Frontend runs at http://localhost:5173 (proxies API to backend)

## Configuration

Copy `.env.example` to `.env` and adjust:

| Variable | Default | Description |
|----------|---------|-------------|
| `RDAP_CONCURRENCY` | 5 | Max simultaneous RDAP requests |
| `RDAP_TIMEOUT_SECONDS` | 10 | Per-request timeout |
| `DB_PATH` | /data/domains.db | SQLite database path |
| `FRONTEND_PORT` | 80 | Host port for frontend |

### RDAP Rate Limiting

RDAP endpoints are public and their rate-limit behavior is undocumented. If you're running large batches (hundreds of domains), keep the `RDAP_CONCURRENCY` setting conservative to avoid being temporarily blocked. The default of 5 concurrent requests works well for most use cases.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/check` | Check domains (SSE stream) |
| GET | `/api/results` | Get all results |
| POST | `/api/recheck` | Recheck domains |
| DELETE | `/api/results/{id}` | Delete result |
| GET | `/api/export` | Download CSV |
| GET | `/api/tlds` | Get known TLDs from IANA (cached 24h) |

## How It Works

1. Enter domain names (with or without TLDs)
2. Select TLDs to check against
3. Domains with TLDs are checked as-is
4. Bare domains are expanded against selected TLDs
5. Results are saved to SQLite and displayed
6. Use "Recheck ALL Available" to verify availability of domains marked AVAILABLE

### TLD Validation

The app fetches the authoritative list of TLDs from [IANA](https://data.iana.org/TLD/tlds-alpha-by-domain.txt) and caches it for 24 hours. When you enter a custom TLD:

- **Valid TLDs** (e.g., `.com`, `.io`, `.ai`) are checked normally
- **Unknown TLDs** (e.g., `.g0ld`, `.notreal`) show a warning — RDAP may return "available" for non-existent TLDs, which can be misleading
- **Invalid TLDs** (e.g., containing spaces or special characters) are skipped entirely

## Tech Stack

- **Backend**: FastAPI, httpx, aiosqlite
- **Frontend**: React 18, Vite 5, Tailwind CSS
- **PWA**: vite-plugin-pwa with Workbox
- **Domain API**: RDAP (IANA/ICANN standard)

## Disclaimer

This tool uses the public RDAP protocol for domain availability lookups. Results are informational only and may not reflect real-time registrar status. Always verify availability directly with your registrar before making purchasing decisions.

## License

MIT License — see [LICENSE](LICENSE) for details.
