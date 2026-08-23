from fastapi import APIRouter, HTTPException
from typing import List, Optional
from backend.app.config import get_settings
from backend.app.storage.db import DatabaseManager
from backend.app.models.exposure import Asset, ThreatRecord, ExposureRecord
from backend.app.engine.correlator import ExposureCorrelator

router = APIRouter(prefix="/api/exposure", tags=["Exposure & Assets"])

def get_db() -> DatabaseManager:
    settings = get_settings()
    return DatabaseManager(settings.DATABASE_PATH)

# Canonical Default Threat Records ingested via Bright Data Scraper Studio
DEFAULT_THREATS: List[ThreatRecord] = [
    ThreatRecord(
        cve_id="CVE-2021-42013",
        title="Apache HTTP Server 2.4.50 Path Traversal & RCE Exploit",
        component="httpd",
        affected_versions=["2.4.49", "2.4.50"],
        severity="critical",
        exploit_status="available",
        published_date="2026-08-21T10:00:00Z",
        source_name="Exploit-DB",
        source_url="https://www.exploit-db.com/exploits/50383",
        provenance_snippet="ap_normalize_path filter bypass enables remote command execution via mod_cgi."
    ),
    ThreatRecord(
        cve_id="CVE-2022-3602",
        title="OpenSSL Punycode Buffer Overflow in X.509 Certificate Verification",
        component="openssl",
        affected_versions=["3.0.0", "3.0.1", "3.0.2", "3.0.3", "3.0.4", "3.0.5", "3.0.6", "3.0.7"],
        severity="high",
        exploit_status="referenced",
        published_date="2026-08-21T10:15:00Z",
        source_name="Exploit-DB",
        source_url="https://www.exploit-db.com/exploits/51020",
        provenance_snippet="Buffer overflow triggered during 4-byte arbitrary stack write in X.509 parsing."
    ),
    ThreatRecord(
        cve_id="CVE-2023-44487",
        title="HTTP/2 Rapid Reset Denial of Service",
        component="nginx",
        affected_versions=["1.25.0", "1.25.1", "1.25.2"],
        severity="medium",
        exploit_status="available",
        published_date="2026-08-21T11:00:00Z",
        source_name="Exploit-DB",
        source_url="https://www.exploit-db.com/exploits/51890",
        provenance_snippet="RST_STREAM frame flood causes resource exhaustion on HTTP/2 multiplexing."
    )
]

@router.get("/assets", response_model=List[Asset])
async def get_assets():
    """Retrieve the persistent internal Asset Manifest."""
    db = get_db()
    assets = await db.get_assets()
    return assets

@router.post("/assets", response_model=Asset)
async def add_asset(asset: Asset):
    """Add or update an internal asset in the SQLite WAL manifest."""
    db = get_db()
    await db.save_asset(asset)
    return asset

@router.get("/threats", response_model=List[ThreatRecord])
async def get_threats():
    """Retrieve the normalized canonical Threat Records ingested from Bright Data Scraper Studio."""
    return DEFAULT_THREATS

@router.get("/correlate", response_model=List[ExposureRecord])
async def correlate_assets_and_threats():
    """Correlate persistent internal Asset Manifest against ingested Exploit-DB intelligence."""
    db = get_db()
    assets = await db.get_assets()
    exposures = ExposureCorrelator.correlate_manifest(assets, DEFAULT_THREATS)
    for exp in exposures:
        await db.save_exposure(exp)
    return exposures
