import pytest
from backend.app.models.exposure import Asset, ThreatRecord, ExposureStatus, MatchType
from backend.app.engine.correlator import ExposureCorrelator, normalize_component, calculate_priority

def test_component_normalization():
    assert normalize_component("Apache HTTP Server") == "httpd"
    assert normalize_component("apache2") == "httpd"
    assert normalize_component("HTTPD") == "httpd"
    assert normalize_component("OpenSSL Library") == "openssl"
    assert normalize_component("nginx") == "nginx"

def test_exact_version_match_affected():
    asset = Asset(
        asset_id="srv-01",
        name="Apache HTTP Server",
        component="httpd",
        version="2.4.50",
        environment="production",
        criticality="high"
    )
    threat = ThreatRecord(
        cve_id="CVE-2021-42013",
        title="Path Traversal & RCE",
        component="httpd",
        affected_versions=["2.4.49", "2.4.50"],
        severity="critical",
        exploit_status="available",
        source_name="Exploit-DB",
        source_url="https://exploit-db.com/50383"
    )

    exposure = ExposureCorrelator.correlate(asset, threat)
    assert exposure is not None
    assert exposure.correlation_status == ExposureStatus.AFFECTED
    assert exposure.match_type == MatchType.EXACT_VERSION
    assert exposure.priority == "P0"
    assert exposure.recommendation_action == "UPGRADE"
    assert "2.4.50" in exposure.why_affected

def test_safe_version_not_affected():
    asset = Asset(
        asset_id="srv-02",
        name="Apache HTTP Server",
        component="httpd",
        version="2.4.58",  # Safe version
        environment="production",
        criticality="high"
    )
    threat = ThreatRecord(
        cve_id="CVE-2021-42013",
        title="Path Traversal & RCE",
        component="httpd",
        affected_versions=["2.4.49", "2.4.50"],
        severity="critical",
        exploit_status="available",
        source_name="Exploit-DB",
        source_url="https://exploit-db.com/50383"
    )

    exposure = ExposureCorrelator.correlate(asset, threat)
    assert exposure is None  # Filtered out because asset is definitively safe

def test_component_only_match_unknown():
    asset = Asset(
        asset_id="srv-03",
        name="OpenSSL",
        component="openssl",
        version="3.0.7",
        environment="production",
        criticality="medium"
    )
    threat = ThreatRecord(
        cve_id="CVE-2026-9999",
        title="Generic OpenSSL Flaw",
        component="openssl",
        affected_versions=[],  # Source did not specify exact versions
        severity="medium",
        exploit_status="unknown",
        source_name="Exploit-DB",
        source_url="https://exploit-db.com"
    )

    exposure = ExposureCorrelator.correlate(asset, threat)
    assert exposure is not None
    assert exposure.correlation_status == ExposureStatus.UNKNOWN
    assert exposure.match_type == MatchType.COMPONENT_ONLY
    assert exposure.recommendation_action == "INVESTIGATE"

def test_mismatched_component():
    asset = Asset(
        asset_id="srv-04",
        name="Nginx Ingress",
        component="nginx",
        version="1.24.0",
        environment="production"
    )
    threat = ThreatRecord(
        cve_id="CVE-2021-42013",
        title="Apache HTTP Server Flaw",
        component="httpd",
        affected_versions=["2.4.50"],
        source_name="Exploit-DB",
        source_url="https://exploit-db.com"
    )

    exposure = ExposureCorrelator.correlate(asset, threat)
    assert exposure is None
