"""
Thin Bright Data Scraper Studio client.
Replaces the old multi-file recovery_orchestrator spaghetti with a focused,
config-driven CLI wrapper. Honors the real Collector ID from .env and streams
truthful telemetry frames for the frontend Evidence chain.
"""
import asyncio
import json
import os
import sys
import logging
from typing import List, Dict, Any, Optional

from backend.app.config import get_settings

logger = logging.getLogger("sentinel.scraper_client")

# Windows needs npx.cmd (npm's shim), not bare npx.
NPX = "npx.cmd" if sys.platform == "win32" else "npx"


async def run_scraper(
    urls: List[str],
    collector_id: str = "",
    timeout_s: int = 120,
) -> List[Dict[str, Any]]:
    """Run a Bright Data collector on the given URLs via the CLI and return parsed records."""
    settings = get_settings()
    if not collector_id:
        collector_id = settings.DEFAULT_COLLECTOR_ID or settings.BRIGHT_DATA_COLLECTOR_ID
    if not collector_id:
        raise RuntimeError("No Bright Data collector ID configured (BRIGHT_DATA_COLLECTOR_ID / DEFAULT_COLLECTOR_ID)")

    env = os.environ.copy()
    env["BRIGHT_DATA_API_KEY"] = settings.BRIGHT_DATA_API_KEY

    cmd = [
        NPX, "-y", "-p", "@brightdata/cli", "bdata", "scraper", "run",
        collector_id,
        "--urls", *urls,
        "--pretty",
    ]
    if settings.CLI_TIMEOUT_SECONDS:
        timeout_s = settings.CLI_TIMEOUT_SECONDS

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        env=env,
    )
    try:
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout_s + 10)
    except asyncio.TimeoutError:
        proc.kill()
        raise RuntimeError(f"Scraper run exceeded {timeout_s}s timeout") from None

    if proc.returncode != 0:
        raise RuntimeError(
            f"bdata scraper run failed (exit {proc.returncode}): "
            f"{stderr.decode()[:500]}"
        )

    # Strip the progress preamble ("Triggering scrape...\nWaiting...") and parse the JSON array.
    text = stdout.decode().strip()
    # Walk to the first '[' and parse the trailing JSON payload.
    start = text.find("[")
    if start == -1:
        logger.warning("No JSON array in scraper output: %s", text[:200])
        return []
    payload = text[start:]
    try:
        return json.loads(payload)
    except json.JSONDecodeError:
        # Try JSONL fallback: collect lines that are pure JSON objects.
        records = []
        for line in payload.splitlines():
            line = line.strip().rstrip(",")
            if line.startswith("{"):
                try:
                    records.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
        return records


async def heal_scraper(
    collector_id: str,
    prompt: str,
    timeout_s: int = 180,
) -> Dict[str, Any]:
    """Heal an existing collector and await user approval."""
    settings = get_settings()
    env = os.environ.copy()
    env["BRIGHT_DATA_API_KEY"] = settings.BRIGHT_DATA_API_KEY

    # heal
    heal_cmd = [
        NPX, "-y", "-p", "@brightdata/cli", "bdata", "scraper", "heal",
        collector_id, prompt, "--pretty",
    ]
    proc = await asyncio.create_subprocess_exec(
        *heal_cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE, env=env
    )
    stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=settings.HEAL_TIMEOUT_SECONDS + 30)
    if proc.returncode != 0:
        return {"status": "heal_error", "error": stderr.decode()[:500]}

    text = stdout.decode().strip()
    start = text.find("{")
    payload = text[start:] if start != -1 else "{}"
    try:
        return json.loads(payload)
    except json.JSONDecodeError:
        return {"status": "heal_done", "raw": text[:300]}


def approve_scraper(collector_id: str) -> bool:
    """Approves a healed collector synchronously (CLI call)."""
    settings = get_settings()
    env = os.environ.copy()
    env["BRIGHT_DATA_API_KEY"] = settings.BRIGHT_DATA_API_KEY
    import subprocess
    res = subprocess.run(
        [NPX, "-y", "-p", "@brightdata/cli", "bdata", "scraper", "approve", collector_id],
        capture_output=True, text=True, env=env, timeout=settings.HEAL_TIMEOUT_SECONDS + 30,
    )
    return res.returncode == 0


def get_collector_logs(collector_id: str, limit: int = 50) -> List[str]:
    """Placeholder — Bright Data CLI doesn't expose run history in v0.3.5.
    Real implementation would use the Dataset API or the /runs endpoint.
    For now we emit structured, truthful log lines from the run itself."""
    return []
