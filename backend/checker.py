import asyncio
import os
import re
from datetime import datetime
from typing import AsyncGenerator, Optional

import httpx

RDAP_CONCURRENCY = int(os.environ.get("RDAP_CONCURRENCY", "5"))
RDAP_TIMEOUT = int(os.environ.get("RDAP_TIMEOUT_SECONDS", "10"))

KNOWN_TLDS = {
    "com", "io", "ai", "co", "net", "org", "dev", "app", "xyz",
    "me", "info", "biz", "us", "uk", "de", "fr", "es", "it", "nl",
    "ru", "cn", "jp", "kr", "in", "br", "au", "ca", "mx", "tech",
    "online", "site", "store", "shop", "blog", "cloud", "pro",
}

# Valid domain pattern: alphanumeric, hyphens, dots only
DOMAIN_PATTERN = re.compile(
    r'^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$',
    re.IGNORECASE
)


def is_valid_domain(domain: str) -> bool:
    """Validate domain name format."""
    if not domain or len(domain) > 253:
        return False
    # Remove any whitespace
    domain = domain.strip()
    if ' ' in domain or '\t' in domain:
        return False
    return bool(DOMAIN_PATTERN.match(domain))


def parse_domain(domain: str) -> tuple[str, Optional[str]]:
    """Parse domain into (base_name, tld). Returns (domain, None) if no TLD found."""
    domain = domain.strip().lower()
    if not domain:
        return ("", None)

    parts = domain.rsplit(".", 1)
    if len(parts) == 2 and parts[1] in KNOWN_TLDS:
        return (parts[0], parts[1])
    return (domain, None)


def expand_domains(domains: list[str], tlds: list[str]) -> list[tuple[str, str, str]]:
    """
    Expand domain list based on TLD logic.
    Returns list of (full_domain, base_name, tld).
    Skips invalid domain names.
    """
    result = []
    tlds = [t.strip().lower().lstrip(".") for t in tlds if t.strip()]

    for domain in domains:
        # Clean the domain: strip whitespace, lowercase, remove internal spaces
        domain = domain.strip().lower().replace(" ", "").replace("\t", "")
        if not domain or domain.startswith("#"):
            continue

        base_name, existing_tld = parse_domain(domain)
        if not base_name:
            continue

        if existing_tld:
            # Domain already has TLD - validate and check as-is
            full_domain = f"{base_name}.{existing_tld}"
            if is_valid_domain(full_domain):
                result.append((full_domain, base_name, existing_tld))
        elif tlds:
            # No TLD - expand against all selected TLDs
            for tld in tlds:
                full_domain = f"{base_name}.{tld}"
                if is_valid_domain(full_domain):
                    result.append((full_domain, base_name, tld))
        else:
            # No TLD and no TLDs selected - use .com default
            full_domain = f"{base_name}.com"
            if is_valid_domain(full_domain):
                result.append((full_domain, base_name, "com"))

    return result


async def check_domain(
    client: httpx.AsyncClient, domain: str, base_name: str, tld: str
) -> dict:
    """
    Check domain availability via RDAP.
    Returns dict with domain info and status.
    """
    url = f"https://rdap.org/domain/{domain}"
    checked_at = datetime.utcnow()

    try:
        response = await client.get(url, follow_redirects=True)

        if response.status_code == 404:
            # Domain not found = available
            return {
                "domain": domain,
                "base_name": base_name,
                "tld": tld,
                "status": "AVAILABLE",
                "registrar": None,
                "expiry": None,
                "checked_at": checked_at,
            }
        elif response.status_code == 200:
            # Domain exists = taken
            data = response.json()
            registrar = extract_registrar(data)
            expiry = extract_expiry(data)
            return {
                "domain": domain,
                "base_name": base_name,
                "tld": tld,
                "status": "TAKEN",
                "registrar": registrar,
                "expiry": expiry,
                "checked_at": checked_at,
            }
        else:
            return {
                "domain": domain,
                "base_name": base_name,
                "tld": tld,
                "status": "ERROR",
                "registrar": None,
                "expiry": None,
                "checked_at": checked_at,
            }
    except Exception:
        return {
            "domain": domain,
            "base_name": base_name,
            "tld": tld,
            "status": "ERROR",
            "registrar": None,
            "expiry": None,
            "checked_at": checked_at,
        }


def extract_registrar(data: dict) -> Optional[str]:
    """Extract registrar name from RDAP response."""
    entities = data.get("entities", [])
    for entity in entities:
        roles = entity.get("roles", [])
        if "registrar" in roles:
            vcard = entity.get("vcardArray", [])
            if len(vcard) > 1:
                for item in vcard[1]:
                    if item[0] == "fn":
                        return item[3]
            # Fallback to handle
            return entity.get("handle")
    return None


def extract_expiry(data: dict) -> Optional[str]:
    """Extract expiry date from RDAP response."""
    events = data.get("events", [])
    for event in events:
        if event.get("eventAction") == "expiration":
            return event.get("eventDate", "")[:10]  # Just date part
    return None


async def check_domains_batch(
    domains: list[tuple[str, str, str]],
) -> AsyncGenerator[dict, None]:
    """
    Check multiple domains with concurrency limit.
    Yields results as they complete.
    """
    semaphore = asyncio.Semaphore(RDAP_CONCURRENCY)

    async def check_with_semaphore(
        client: httpx.AsyncClient, domain: str, base_name: str, tld: str
    ) -> dict:
        async with semaphore:
            return await check_domain(client, domain, base_name, tld)

    async with httpx.AsyncClient(timeout=RDAP_TIMEOUT) as client:
        tasks = [
            asyncio.create_task(check_with_semaphore(client, domain, base_name, tld))
            for domain, base_name, tld in domains
        ]

        for coro in asyncio.as_completed(tasks):
            result = await coro
            yield result
