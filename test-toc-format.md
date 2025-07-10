## Expected TOC Output

For a document with these headings:
```markdown
# Introduction
## Getting Started
### Prerequisites
## Advanced Topics
```

The TOC should generate:
```markdown
## Table of Contents

- [[#Introduction]]
- [[#Getting Started]]
  - [[#Prerequisites]]
- [[#Advanced Topics]]
```

This follows the correct Obsidian format:
- `[[#heading text]]` - links to heading in same file
- No custom anchors needed - Obsidian handles this automatically
- Preserves original heading text exactly as written