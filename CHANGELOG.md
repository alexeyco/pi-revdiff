# Changelog

## 0.2.0

### Changed

- Default shortcut changed from `Ctrl+R` to `Ctrl+Shift+R` to avoid conflict with Pi's built-in session rename.
- Shortcut is now configurable via `shortcut` field in `~/.pi/agent/pi-revdiff.json`. Supports modifiers (`ctrl`, `shift`, `alt`, `super`) and any single character or special key (f1–f12, escape, pageUp, etc.).

## 0.1.1

### Documentation

- Move detailed docs to `docs/` directory (configuration, architecture, keybindings).
- Shorten README to essentials: install, usage, links.
- Update AGENTS.md layout to reflect `docs/` structure.
- Add `docs` to package files for npm distribution.

### Dependencies

- `typescript` 5.9.3 → 7.0.2
- `@types/node` 22.20.5 → 26.6.3
- `actions/checkout` 4 → 7
- `actions/setup-node` 4 → 7

## 0.1.0

- Initial release.
- `review` tool launching revdiff TUI for interactive diff review.
- `Ctrl+R` shortcut for one-key diff review.
- Configurable delivery mode (`steer` / `followUp`).
- Persistent config in `~/.pi/agent/pi-revdiff.json`.
