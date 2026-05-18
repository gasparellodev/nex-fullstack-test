<!--
Title MUST follow Conventional Commits, e.g.:
  feat(api): add spreadsheet import endpoint
  fix(web): handle 401 on token refresh
-->

## Linked issue

Closes #<issue-number>

## Spec

Link to the spec in `docs/specs/` that drove this change.

## Summary

<!-- 1–3 bullets explaining what changed and why. -->

-

## How to test

```bash
# example
pnpm --filter @nex/api test path/to/file.test.ts
```

## Screenshots / demo

<!-- For UI changes attach screenshots or short clips. -->

## Quality checklist

- [ ] Spec written/updated in `docs/specs/`
- [ ] Tests added and passing (`pnpm test`)
- [ ] Lint clean (`pnpm lint`)
- [ ] Typecheck clean (`pnpm typecheck`)
- [ ] Coverage non-regressed (`pnpm test:coverage`)
- [ ] `/security-review` executed → no high severity findings
- [ ] `/code-review` executed → feedback addressed
- [ ] `/react-best-practices` executed (if touches `.tsx`)
- [ ] `/shadcn` followed for new UI components (if applicable)
- [ ] `/frontend-design:frontend-design` consulted (if UI changes)
- [ ] LGPD impact considered (no new PII without encryption + audit + consent)
- [ ] CHANGELOG / README updated if behavior changed
- [ ] Conventional Commits in the commit history
