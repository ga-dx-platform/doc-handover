# GA-DX Platform Engineering Standard

This repository is part of GA-DX Platform (General Affairs Digital Transformation Platform).

Goal:
Build a modern enterprise internal platform with consistent UX and UI.

Main rule:
Always follow GA-DX Design System located in /design-system/

General coding rules:

UI:
- Modern SaaS design
- Card based layout
- Clean spacing
- Professional typography
- Soft interaction

UX:
- Improve clarity
- Improve hierarchy
- Improve usability
- Keep workflow simple

Refactoring rules:
- Do NOT break logic
- Do NOT change backend behavior
- Improve UI only unless requested
- Convert repeated UI into components

Design consistency:
- Use same button style
- Use same card style
- Use same spacing system
- Use same color system

Component rules:
- Reusable components first
- Avoid duplicated UI code
- Create shared components if repeated 2+ times

Code quality:
- Senior frontend engineer standard
- Readable code
- Clean structure
- Production ready

When improving UI:
Always modernize design to match enterprise SaaS platforms.

Priority:
Consistency > Fancy design
Usability > Decoration
Clarity > Complexity

# AI Instructions Priority

When modifying UI always read:

1. ga-dx-design-system.md
2. component-standard.md
3. codex-ui-refactor.txt

These files define UI standards.

Always apply them together.

# Refactoring Authority

Codex is allowed to:

Refactor layout structure
Modify HTML structure
Replace class usage
Create reusable UI classes

As long as business logic is unchanged.

Never partially apply design rules.
