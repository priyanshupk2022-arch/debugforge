import uuid
from datetime import datetime
from typing import List, Optional
from backend.app.models.exposure import (
    Asset, ThreatRecord, ExposureRecord, ExposureStatus, MatchType
)

# Canonical component alias mappings
COMPONENT_ALIASES = {
    "apache": "httpd",
    "apache http server": "httpd",
    "apache2": "httpd",
    "httpd": "httpd",
    "openssl": "openssl",
    "openssl library": "openssl",
    "nginx": "nginx",
    "nginx ingress": "nginx",
    "wordpress": "wordpress"
}

def normalize_component(comp: str) -> str:
    cleaned = comp.strip().lower()
    return COMPONENT_ALIASES.get(cleaned, cleaned)

def calculate_priority(severity: str, criticality: str, exploit_status: str, env: str) -> str:
    is_prod = env.lower() == "production"
    has_exploit = exploit_status in ["available", "referenced"]
    sev_high_or_crit = severity in ["critical", "high"]
    crit_high_or_crit = criticality in ["critical", "high"]

    if sev_high_or_crit and crit_high_or_crit and has_exploit and is_prod:
        return "P0"
    if (sev_high_or_crit and is_prod) or (has_exploit and is_prod):
        return "P1"
    if severity in ["medium", "high"] or has_exploit:
        return "P2"
    return "P3"

class ExposureCorrelator:
    @staticmethod
    def correlate(asset: Asset, threat: ThreatRecord) -> Optional[ExposureRecord]:
        # 1. Canonical component comparison
        if normalize_component(asset.component) != normalize_component(threat.component):
            return None

        # 2. Version evaluation hierarchy
        installed_ver = asset.version.strip()
        affected_list = [v.strip() for v in threat.affected_versions if v.strip()]

        match_type = MatchType.NONE
        status = ExposureStatus.UNKNOWN

        if installed_ver in affected_list:
            match_type = MatchType.EXACT_VERSION
            status = ExposureStatus.AFFECTED
        elif len(affected_list) == 0:
            match_type = MatchType.COMPONENT_ONLY
            status = ExposureStatus.UNKNOWN
        else:
            status = ExposureStatus.NOT_AFFECTED

        # Filter out assets that are proven unaffected
        if status == ExposureStatus.NOT_AFFECTED:
            return None

        # 3. Calculate Operational Priority
        priority = calculate_priority(
            threat.severity,
            asset.criticality,
            threat.exploit_status,
            asset.environment
        )

        # 4. Action determination
        action = "UPGRADE" if status == ExposureStatus.AFFECTED else "INVESTIGATE"

        # 5. Build Explanation and Evidence
        evidence = [
            f"Source '{threat.source_name}' lists affected versions: {threat.affected_versions or 'unspecified'}",
            f"Asset '{asset.name}' ({asset.asset_id}) has version '{installed_ver}' in '{asset.environment}'",
            f"Exploit intelligence status: {threat.exploit_status}"
        ]
        if threat.provenance_snippet:
            evidence.append(f"Raw source snippet: {threat.provenance_snippet}")

        if status == ExposureStatus.AFFECTED:
            why = (
                f"Installed version '{installed_ver}' exactly matches affected versions in "
                f"{threat.source_name} ({threat.cve_id or 'Advisory'})."
            )
        else:
            why = (
                f"Component '{asset.component}' matched, but installed version '{installed_ver}' "
                f"requires investigation against source advisory."
            )

        return ExposureRecord(
            exposure_id=f"exp-{uuid.uuid4().hex[:8]}",
            asset=asset,
            threat=threat,
            correlation_status=status,
            match_type=match_type,
            priority=priority,
            why_affected=why,
            evidence=evidence,
            recommendation_action=action,
            recommendation_reason=f"{status.value} asset detected with {priority} priority in {asset.environment}",
            calculated_at=datetime.utcnow().isoformat() + "Z"
        )

    @classmethod
    def correlate_manifest(cls, assets: List[Asset], threats: List[ThreatRecord]) -> List[ExposureRecord]:
        exposures: List[ExposureRecord] = []
        for asset in assets:
            for threat in threats:
                res = cls.correlate(asset, threat)
                if res:
                    exposures.append(res)
        return exposures
