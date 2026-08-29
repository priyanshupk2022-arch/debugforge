# ADR 0001: TrueForge Agent Harness & Daytona Isolated Sandboxing

## Context
Traditional AI coding tools rely on static code generation without runtime observation. When AI-generated code crashes in production, developers lack tooling to reproduce and diagnose failures safely.

## Decision
We chose to build **DebugForge** as an autonomous agent harness combining:
1. **TrueForge Agent SDK** for standardized Model Context Protocol (MCP) tool exposure and turn management.
2. **Daytona Sandboxes** for ephemeral, isolated execution environments.
3. **Dynamic Backward Causal Tracing** to isolate true infection origins from superficial crash symptoms.
4. **Triple-Lock Verification** to prevent regression before human sign-off.

## Consequences
- Guarantees zero local host contamination during untrusted code execution.
- Prevents superficial patch band-aids.
- Ensures explicit operator consent via cryptographic HITL approval gates.
