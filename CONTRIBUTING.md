# Contributing to Domain Checker

Thank you for your interest in contributing to Domain Checker!

## Development Setup

### Option 1: Docker (Recommended)

The easiest way to run the full stack:

```bash
docker-compose up -d
```

This starts both the backend and frontend. Access the app at http://localhost.

### Option 2: Local Development

For active development with hot reload, run the backend and frontend separately.

#### Backend (Python)

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# or
.venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at http://localhost:8000.

#### Frontend (React)

```bash
cd frontend

# Install dependencies
npm install
# or
pnpm install

# Run development server
npm run dev
# or
pnpm dev
```

The frontend will be available at http://localhost:5173 and will proxy API requests to the backend.

## Project Structure

```
domain-checker/
├── backend/
│   ├── main.py          # FastAPI routes
│   ├── checker.py       # RDAP domain checking logic
│   ├── db.py            # SQLite database layer
│   └── models.py        # Pydantic models
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # Main application
│   │   ├── api.js       # API client
│   │   └── components/  # React components
│   └── vite.config.js   # Vite + PWA configuration
└── docker-compose.yml
```

## Submitting a Pull Request

1. **Fork the repository** and create your branch from `main`.

2. **Make your changes** following the existing code style:
   - Python: Type hints, async/await patterns
   - React: Functional components with hooks
   - CSS: Tailwind utility classes

3. **Test your changes locally** using either Docker or the local development setup.

4. **Update documentation** if you've changed APIs or added features.

5. **Submit your PR** with a clear description of:
   - What the change does
   - Why it's needed
   - How to test it

## Code Style

### Python (Backend)
- Use type hints for function parameters and return values
- Follow PEP 8 conventions
- Use async/await for I/O operations

### JavaScript/React (Frontend)
- Functional components with hooks
- Tailwind CSS for styling (Bauhaus theme)
- No semicolons (project preference)

## Reporting Issues

Please use the GitHub issue templates for:
- **Bug reports**: Include steps to reproduce, expected vs actual behavior
- **Feature requests**: Describe the use case and proposed solution

## Questions?

Open a discussion or issue if you have questions about contributing.
