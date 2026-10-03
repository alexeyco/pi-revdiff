# @alexeyco/pi-revdiff

<p align="center">
  <img src="assets/hero.svg" alt="Ctrl+R → review → annotate → fix" width="800">
</p>

<p align="center">
  <strong>Interactive diff review for <a href="https://github.com/earendil-works/pi">Pi</a></strong>
</p>

<p align="center">
  <code>Ctrl+R</code> → review your diff → leave annotations → the agent fixes it
</p>

---

Code review should not happen in a separate window or tool.
**pi-revdiff** keeps the entire loop inside your terminal: press
`Ctrl+R`, annotate lines in the revdiff TUI, close the viewer — the
agent reads your annotations and makes the fixes.

## Install

```sh
pi install npm:@alexeyco/pi-revdiff
```

Requires [Pi](https://github.com/earendil-works/pi) and
[revdiff](https://github.com/umputun/revdiff) on `PATH`.

## Usage

Press `Ctrl+R` or ask the agent to `review` your changes.

## Docs

- [Configuration](docs/configuration.md) — `ref`, `staged`, `delivery` settings
- [Architecture](docs/architecture.md) — how the TUI takeover works
- [Keybindings](docs/keybindings.md) — Pi shortcut and revdiff keys
- [Contributing](CONTRIBUTING.md) — development workflow and release process

## License

[MIT](LICENSE)
