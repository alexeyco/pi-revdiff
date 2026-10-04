# Configuration

Configuration is stored in `~/.pi/agent/pi-revdiff.json` and loaded on
session start.

## File format

```json
{
  "ref": "HEAD",
  "staged": false,
  "delivery": "steer",
  "shortcut": "ctrl+shift+r"
}
```

## Fields

| Key | Type | Default | Description |
|---|---|---|---|
| `ref` | string | `"HEAD"` | Default Git ref to diff against |
| `staged` | boolean | `false` | Review staged changes only |
| `delivery` | `"steer"` \| `"followUp"` | `"steer"` | How annotations reach the agent |
| `shortcut` | string | `"ctrl+shift+r"` | Keyboard shortcut to launch review |

### `delivery`

- **steer** — annotations interrupt the current response (faster
  feedback).
- **followUp** — annotations queue after the current response finishes
  (non-blocking).

### `shortcut`

Keyboard shortcut to launch the review. Format: `modifier+key` where
modifier is `ctrl`, `shift`, `alt`, or `super`, and key is a single
character or special key name.

Examples:
- `"ctrl+shift+r"` (default)
- `"ctrl+alt+r"`
- `"alt+r"`

## Editing

Edit the file directly or set values via the tool parameters:

```
review({ ref: "main", staged: true })
```
