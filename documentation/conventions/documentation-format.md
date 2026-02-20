# Documentation Format

**Status:** ✅ Implemented | Token-efficient format for all project docs

## Overview

Use this format for all new or updated documentation files. Keep docs compact, structured, and implementation-focused.

## Key Details

- Every doc should be quickly scannable by humans and AI agents.
- Preserve signatures, config keys, constants, and file-path references.
- Avoid prose-heavy explanations and decorative sections.

## Mandatory Format

```markdown
# [Title]

**Status:** [✅ Implemented / ⏳ In Progress / ❌ Not Started] [Brief]

## Overview
[1-2 sentences max]

## Key Details
- Compact bullet lists
- API signatures
- Data types and values
- Configuration keys

## API/Interfaces
[Tables or compact code blocks]

## Fixed Issues (if any)
[Only important items]

## Related
[links to other docs]
```

## Forbidden Content

- Verbose prose explanations
- "Why?" sections (keep rationale brief and implementation-tied)
- Large ASCII diagrams
- Excessive examples (max 1-2)
- "Future Enhancements" sections
- Empty sections
- Decorative formatting

## Required Content

- API function signatures with parameters
- Props/config keys with types and defaults
- File paths and code locations
- Color values, proportions, constants (where relevant)
- Critical implementation details
- Fixed-issue notes for troubleshooting context

## Token Budget Management

Preserve tokens for implementation, not context gathering.

| Budget | Allocation |
|---|---|
| 20-30% | Reading relevant docs via `documentation/TABLEOFCONTENTS.md` |
| 70-80% | Implementation, debugging, and validation |

Anti-patterns:
- Reading all docs sequentially
- Re-reading the same docs repeatedly
- Reading verbose examples when not needed

Best practices:
- Start with `documentation/TABLEOFCONTENTS.md`
- Read only `Key Details` first
- Open examples only when implementing a matching pattern

## Related

- [../TABLEOFCONTENTS.md](../TABLEOFCONTENTS.md)
- [../guides/documentation-maintenance.md](../guides/documentation-maintenance.md)
