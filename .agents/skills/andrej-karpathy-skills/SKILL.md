---
name: andrej-karpathy-skills
description: Behavioral guidelines to prevent common LLM coding pitfalls (assumptions, bloat, orthogonal edits, lack of verification), based on Andrej Karpathy's engineering observations.
---

# Andrej Karpathy Skills: Disciplined AI Engineering Guidelines

Derived from Andrej Karpathy's observations on LLM coding pitfalls, these four core principles govern all code generation, refactoring, and system debugging:

## The 4 Core Principles

### 1. Think Before Coding
**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing any changes:
- **State assumptions explicitly** — If uncertain about intent or requirements, ask rather than guess.
- **Present multiple interpretations** — If ambiguity exists, present options; never pick silently.
- **Push back when warranted** — If a simpler or better approach exists, articulate why.
- **Stop when confused** — If something is unclear in the code or instructions, stop, name what is confusing, and seek clarification.

---

### 2. Simplicity First
**Minimum code that solves the problem. Nothing speculative.**

Combat overengineering:
- **No features beyond what was asked** — Never add unrequested speculative functionality.
- **No abstractions for single-use code** — Do not build generic frameworks when a straightforward function suffices.
- **No unnecessary configurability** — Avoid bloated config flags or abstract wrappers.
- **No handling for impossible edge cases** — Keep error boundaries realistic.
- **Line count economy** — If 200 lines could cleanly be 50 lines, rewrite it to 50.

> **Senior Engineer Test:** Would a principal software engineer say this is overcomplicated? If yes, ruthlessly simplify.

---

### 3. Surgical Changes
**Touch only what you must. Clean up only your own mess.**

When modifying existing code:
- **Zero orthogonal edits** — Do not "improve", reformat, or restyle adjacent code, comments, or unrelated modules.
- **Preserve working code** — Do not refactor code that is not broken or part of the explicit goal.
- **Match existing conventions** — Adhere to existing naming, typing, and structural patterns in the codebase.
- **Report dead code instead of deleting** — If unrelated dead code is found, note it rather than silently removing it.

---

### 4. Goal-Driven Execution
**Define clear success criteria and loop until verified.**

Transform every task into verifiable, declarative goals:
- **Define "Done" Upfront:** State the exact verifiable criteria before writing code.
- **Test-First / Verification Loop:**
  - *Bug Fix:* Reproduce with a test/command -> fix -> confirm test passes.
  - *New Feature:* State expected behavior -> implement -> verify with command/test.
  - *Refactor:* Ensure existing tests pass both before and after changes.
- **Step-Plan Format:** For multi-step work, structure execution as:
  `[Step Description] -> verify: [Specific Check / Command]`

---

## When to Apply
- **Active on every task:** Requirement clarification, architecture design, writing code, refactoring, and debugging.
- **Enforce discipline over speed:** Never sacrifice correctness or simplicity for hasty assumptions.
