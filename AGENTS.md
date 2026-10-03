# @alexeyco/pi-revdiff

Pi extension that registers a `review` tool and a `Ctrl+R` shortcut —
launching the revdiff TUI for interactive diff review with annotation capture.

Human-facing docs: [README.md](README.md), [CONTRIBUTING.md](CONTRIBUTING.md).

## Layout

```
pi-revdiff/
├── src/
│   ├── index.ts       extension entry (tool, shortcut, TUI takeover)
│   ├── config.ts      load/save pi-revdiff.json
│   └── contract.ts    shared types and constants
├── docs/              configuration, architecture, keybindings
├── test/              unit tests (node --test)
├── .github/workflows/ CI and publish
├── package.json · tsconfig.json · Makefile
├── README.md · AGENTS.md · CONTRIBUTING.md · CHANGELOG.md · LICENSE
```

## Conventions

- All content in English.
- Pi extension API only — no direct terminal spawning, no process
  management. The `review` tool delegates to Pi's built-in `revdiff`.
- Source files: strict TypeScript, `ES2024` target, `NodeNext` modules.
- No runtime dependencies beyond Pi's host-provided packages
  (`@earendil-works/pi-ai`, `@earendil-works/pi-coding-agent`,
  `@earendil-works/pi-tui`). These are `peerDependencies`.
- Run `make fmt` before committing.

## Architecture

The extension has two integration points:

1. **`review` tool** — registered via `pi.registerTool()`. Uses
   `ctx.ui.custom()` for full TUI takeover: `tui.stop()` releases the
   screen, spawns `revdiff` as a child process with `stdio: "inherit"`,
   reads annotations from `-o` temp file on exit, `tui.start()` restores
   Pi's TUI. No external launcher or wrapper scripts.
2. **`Ctrl+R` shortcut** — registered via `pi.registerShortcut()`.
   Sends a steer message to the model asking it to run a review.

Configuration is stored in `~/.pi/agent/pi-revdiff.json` and loaded on
`session_start`. Git operations (`git add`, `git diff`) are executed
via `child_process.spawn` directly — no dependency on Pi's `exec` API.

## Release

Tag-driven npm publish — see [CONTRIBUTING.md](CONTRIBUTING.md#publishing).

## Gallery

The `pi-package` keyword makes this package eligible for discovery in the
[Pi package gallery](https://pi.dev/packages). The `pi.image` field points
to `assets/hero.svg` for the gallery preview thumbnail.
