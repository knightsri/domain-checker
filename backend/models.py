from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class DomainCheckRequest(BaseModel):
    domains: list[str]
    tlds: list[str] = []


class DomainResult(BaseModel):
    id: Optional[int] = None
    domain: str
    base_name: str
    tld: str
    status: str  # AVAILABLE, TAKEN, ERROR
    registrar: Optional[str] = None
    expiry: Optional[str] = None
    checked_at: datetime


class RecheckRequest(BaseModel):
    ids: list[int] = []  # Empty means recheck all available


class ResultsFilter(BaseModel):
    status: Optional[str] = None
    tld: Optional[str] = None
    search: Optional[str] = None
