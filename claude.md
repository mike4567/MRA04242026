# CLAUDE.md: Project Governance & Workflow

## Compliance References
- NIST SP 800-218 (SSDF)
- NAO 212-13 (Environmental Data Management)
- NAO 201-118 (IT Management)

## Mandatory Workflow
1. **Plan:** Agent provides a Technical Spec.
2. **Audit:** Human reviews spec for NIST compliance and logic.
3. **Execute:** Agent implements changes in atomic steps.
4. **Test:** All verification must occur via CLI (e.g., `make test`).

## Technical Standards
- **Style:** 4-space indent, mandatory braces.
- **Portability:** Platform-agnostic paths; no IDE-specific dependencies.
