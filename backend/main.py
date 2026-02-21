import csv
import io
import json
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse

from checker import check_domains_batch, expand_domains
from db import (
    delete_result,
    delete_results,
    get_available_domains,
    get_domains_by_ids,
    get_results,
    init_db,
    upsert_result,
)
from models import DomainCheckRequest, RecheckRequest


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Domain Checker", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/check")
async def check_domains(request: DomainCheckRequest):
    """Check domain availability and stream results via SSE."""
    domains = expand_domains(request.domains, request.tlds)
    total = len(domains)

    async def event_generator():
        yield {"event": "start", "data": json.dumps({"total": total})}

        count = 0
        async for result in check_domains_batch(domains):
            # Save to database
            await upsert_result(
                domain=result["domain"],
                base_name=result["base_name"],
                tld=result["tld"],
                status=result["status"],
                registrar=result["registrar"],
                expiry=result["expiry"],
                checked_at=result["checked_at"],
            )

            count += 1
            result["checked_at"] = result["checked_at"].isoformat()
            yield {
                "event": "result",
                "data": json.dumps({"result": result, "progress": count, "total": total}),
            }

        yield {"event": "complete", "data": json.dumps({"total": count})}

    return EventSourceResponse(event_generator())


@app.get("/api/results")
async def get_all_results(
    status: Optional[str] = Query(None),
    tld: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
):
    """Get all results with optional filters."""
    results = await get_results(status=status, tld=tld, search=search)
    return {"results": results}


@app.post("/api/recheck")
async def recheck_domains(request: RecheckRequest):
    """Recheck selected domains or all available."""
    if request.ids:
        # Recheck specific domains
        domains_to_check = await get_domains_by_ids(request.ids)
    else:
        # Recheck all available
        domains_to_check = await get_available_domains()

    if not domains_to_check:
        return {"message": "No domains to recheck", "total": 0}

    # Build domain tuples for checking
    domain_tuples = [
        (d["domain"], d["base_name"], d["tld"]) for d in domains_to_check
    ]
    total = len(domain_tuples)

    async def event_generator():
        yield {"event": "start", "data": json.dumps({"total": total})}

        count = 0
        async for result in check_domains_batch(domain_tuples):
            await upsert_result(
                domain=result["domain"],
                base_name=result["base_name"],
                tld=result["tld"],
                status=result["status"],
                registrar=result["registrar"],
                expiry=result["expiry"],
                checked_at=result["checked_at"],
            )

            count += 1
            result["checked_at"] = result["checked_at"].isoformat()
            yield {
                "event": "result",
                "data": json.dumps({"result": result, "progress": count, "total": total}),
            }

        yield {"event": "complete", "data": json.dumps({"total": count})}

    return EventSourceResponse(event_generator())


@app.delete("/api/results/{result_id}")
async def delete_single_result(result_id: int):
    """Delete a single result."""
    deleted = await delete_result(result_id)
    if deleted:
        return {"message": "Deleted", "id": result_id}
    return Response(status_code=404, content="Not found")


@app.post("/api/results/delete")
async def delete_multiple_results(ids: list[int]):
    """Delete multiple results."""
    count = await delete_results(ids)
    return {"message": f"Deleted {count} results", "count": count}


@app.get("/api/export")
async def export_csv():
    """Export all results as CSV."""
    results = await get_results()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["domain", "status", "registrar", "expiry", "checked_at"])

    for r in results:
        writer.writerow([
            r["domain"],
            r["status"],
            r["registrar"] or "",
            r["expiry"] or "",
            r["checked_at"],
        ])

    output.seek(0)
    date_str = datetime.utcnow().strftime("%Y-%m-%d")

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=domain-check-{date_str}.csv"},
    )


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
