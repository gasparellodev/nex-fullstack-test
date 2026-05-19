# Specifications (SDD)

This directory holds **specs** authored *before* the implementation of a
feature. Workflow per feature:

1. Open an Issue.
2. Author a spec at `docs/specs/YYYY-MM-DD-<slug>.md` using
   [`_template.md`](./_template.md).
3. Approval on the spec PR (or commit on the feature branch) gates the
   implementation work.
4. Implementation PR references the spec from its description.

Keep specs in English. Specs are *living* documents — update them as
implementation reveals incorrect assumptions, and note the change in the spec
itself.
