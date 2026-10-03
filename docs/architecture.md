# Architecture

pi-revdiff manages the revdiff lifecycle directly — no shell launcher,
no external wrapper.

## Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Ctrl+R     │────▶│   revdiff    │────▶│  Annotations │
│  (shortcut)  │     │  (child TUI) │     │  (-o file)   │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                 │
                                                 ▼
                                         ┌──────────────┐
                                         │    Agent     │
                                         │  (fixes it)  │
                                         └──────────────┘
```

## Steps

1. **Ctrl+R** sends a steer message to the agent asking it to run a
   review.
2. The agent calls the `review` tool, which:
   - Runs `git add -A` to stage all changes.
   - Calls `ctx.ui.custom()` to take over the terminal.
   - Calls `tui.stop()` to release the screen.
   - Spawns `revdiff` as a child process with `stdio: "inherit"`.
3. You scroll, read, and **annotate** lines inside the revdiff TUI.
4. When you quit (`q`), revdiff writes annotations to a temp file
   (`-o`).
5. The extension calls `tui.start()` to restore Pi's TUI, reads the
   annotation file, and returns the text to the agent.
6. The agent reads each annotation, locates the relevant code, and
   makes changes or explains its reasoning.

## Git integration

- In a git repo: `git add -A` stages all changes before revdiff. If
  nothing is staged and no `ref` is given, revdiff opens with
  `--all-files`.
- Outside a git repo: enumerates text files via `fd --type f
  --max-results 200 --print0`, filtering binary extensions.

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Clean quit, no annotations |
| `10` | Annotations captured (success) |
| Other | Error |
