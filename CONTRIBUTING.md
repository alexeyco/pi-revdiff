# Contributing

## Branching

- Never push to `main`.
- Branch from `main`: `git checkout -b feat/<topic>`.
- Commit messages: imperative mood, no conventional prefixes —
  e.g. `Add delivery mode config`, `Fix annotation parsing`.

## Development

Install dependencies and run the checks — same as CI:

```sh
npm ci
make fmt
make check
```

Test locally without publishing:

```sh
# Copy to your Pi extensions directory
cp -r . ~/.pi/agent/extensions/pi-revdiff

# Or use the -e flag
pi -e /absolute/path/to/pi-revdiff
```

Edits take effect on `/reload` — no reinstall needed.

## Publishing

1. Add a `CHANGELOG.md` entry for the new version.
2. Bump `version` in `package.json` (semver) and refresh the committed
   `package-lock.json` with `npm install`.
3. Merge the PR to `main`.
4. Tag and push the tag:

   ```sh
   git tag vX.Y.Z && git push origin vX.Y.Z
   ```

5. The `publish` workflow runs `npm publish` with provenance on tag push.
