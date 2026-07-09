# Agent Instructions

This project has project-local Codex skills installed under `.codex/skills`.
Use them automatically when the user's request matches the trigger below.

## Installed Project Skills

- `grill-with-docs`: Use when a plan, feature design, architecture proposal, or ambiguous product decision needs to be pressure-tested. Run a grilling-style interview and produce or update supporting decision docs such as ADRs and glossary notes when useful.
- `to-prd`: Use when the user asks to turn an existing conversation, rough idea, notes, or agreed feature direction into a PRD. Synthesize from the current context instead of interviewing from scratch.
- `tdd`: Use when the user wants test-first development, mentions TDD or red-green-refactor, asks for integration tests, or asks to build or fix something with tests as the driver.
- `diagnosing-bugs`: Use when the user reports something broken, failing, throwing, slow, flaky, or asks to debug or diagnose a bug or performance regression.

## Automatic Invocation Rules

- If the user says "diagnose", "debug", "bug", "broken", "failing", "error", "slow", "flaky", or describes a reproducible problem, load and follow `diagnosing-bugs`.
- If the user says "TDD", "test-first", "red-green-refactor", "write tests first", "add tests", or asks for behavior-driven implementation, load and follow `tdd`.
- If the user says "PRD", "product requirements", "requirements doc", "turn this into requirements", or asks to turn the current discussion into a product spec, load and follow `to-prd`.
- If the user asks to challenge, grill, pressure-test, refine, or interrogate a plan or design, load and follow `grill-with-docs`.

## Usage Notes

- Always read the selected skill's `SKILL.md` before applying it.
- If multiple skills match, use the smallest useful set and state the order.
- Preserve this project's existing implementation style and avoid unrelated refactors.
- For project documentation created by these skills, prefer `docs/` unless the user names another destination.
