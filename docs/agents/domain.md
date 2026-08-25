# Domain Documentation

Engineering skills should consult this repository's domain documentation before exploring or changing the codebase.

## Sources

- Read the root `CONTEXT.md` when it exists.
- Read relevant decisions under `docs/adr/`.
- If either location is absent, continue silently.
- Domain documentation should be created only when useful domain terms or decisions have actually been established.

## Layout

This is a single-context repository:

```
/
├── CONTEXT.md
├── docs/
│   └── adr/
└── src/
```

## Vocabulary

Use domain concepts exactly as defined in `CONTEXT.md`. Avoid introducing synonyms that conflict with its glossary.

If a necessary concept is missing, reconsider whether it belongs to the project vocabulary or record the gap for later domain modeling.

## Architecture decisions

If proposed work conflicts with an existing ADR, identify the conflict explicitly instead of silently overriding the decision.
