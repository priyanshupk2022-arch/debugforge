from enum import Enum
from typing import List, Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field

# =========================================================================
# INTERNAL ASSET MANIFEST MODELS
# =========================================================================

class Asset(BaseModel):
    asset_id: str = Field(..., description="Unique internal asset identifier e.g. srv-prod-web-01")
    name: str = Field(..., description="Human readable name e.g. Apache HTTP Server")
    component: str = Field(..., description="Canonical component identifier e.g. httpd, openssl, nginx")
    version: str = Field(..., description="Installed version e.g. 2.4.50")
    environment: str = Field(default="production", description="Environment tier: production, staging, dmz, dev")
    criticality: str = Field(default="high", description="Business criticality: critical, high, medium, low")
    source: str = Field(default="manual", description="Asset source origin: manual, sbom, inventory")

# =========================================================================
# CANONICAL THREAT RECORD MODELS (EXTRACTED VIA BRIGHT DATA SCRAPER STUDIO)
# =========================================================================

class ThreatRecord(BaseModel):
    cve_id: Optional[str] = Field(default=None, description="CVE identifier e.g. CVE-2021-42013")
    title: str = Field(..., description="Exploit or advisory title")
    component: str = Field(..., description="Target component e.g. httpd, openssl, nginx")
    affected_versions: List[str] = Field(default_factory=list, description="List of explicitly affected version strings")
    severity: Literal["critical", "high", "medium", "low", "unknown"] = Field(default="unknown")
    exploit_status: Literal["available", "referenced", "none_observed", "unknown"] = Field(default="unknown")
    published_date: Optional[str] = Field(default=None, description="ISO-8601 publication timestamp if available")
    source_name: str = Field(default="Exploit-DB", description="Origin source name")
    source_url: str = Field(default="", description="Origin URL of the exploit advisory")
    provenance_snippet: Optional[str] = Field(default=None, description="Raw source excerpt proving affected versions/exploit")

# =========================================================================
# CORRELATED EXPOSURE MODELS
# =========================================================================

class ExposureStatus(str, Enum):
    AFFECTED = "AFFECTED"
    NOT_AFFECTED = "NOT_AFFECTED"
    UNKNOWN = "UNKNOWN"

class MatchType(str, Enum):
    EXACT_VERSION = "EXACT_VERSION"
    VERSION_RANGE = "VERSION_RANGE"
    COMPONENT_ONLY = "COMPONENT_ONLY"
    NONE = "NONE"

class ExposureRecord(BaseModel):
    exposure_id: str
    asset: Asset
    threat: ThreatRecord
    correlation_status: ExposureStatus
    match_type: MatchType
    priority: Literal["P0", "P1", "P2", "P3"]
    why_affected: str
    evidence: List[str]
    recommendation_action: Literal["UPGRADE", "PATCH", "MITIGATE", "INVESTIGATE", "MONITOR"]
    recommendation_reason: str
    calculated_at: str
