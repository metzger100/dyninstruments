# Documentation Format

**Status:** Current.

## Overview

Use this format for all new or updated documentation files. Keep docs compact, structured, and implementation-focused.

## Key Details

- Every doc should be quickly scannable by humans and AI agents.
- Preserve signatures, config keys, constants, and file-path references.
- Avoid prose-heavy explanations and decorative sections.

## Mandatory Format

```markdown
# [Title]

**Status:** Current.

## Overview

[1-2 sentences max]

## Key Details

- Compact bullet lists
- API signatures
- Data types and values
- Configuration keys

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

## Related

- [../TABLEOFCONTENTS.md](../TABLEOFCONTENTS.md)
- [../guides/documentation-maintenance.md](../guides/documentation-maintenance.md)
