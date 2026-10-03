# Configuration

Configuration is stored in `~/.pi/agent/pi-revdiff.json` and loaded on
session start.

## File format

```json
{
  "ref": "HEAD",
  "staged": false,
  "delivery": "steer"
}
```

## Fields

| Key | Type | Default | Description |
|---|---|---|---|
| `ref` | string | `"HEAD"` | Default Git ref to diff against |
| `staged` | boolean | `false` | Review staged changes only |
| `delivery` | `"steer"` \| `"followUp"` | `"steer"` | How annotations reach the agent |

### `delivery`

- **steer** — annotations interrupt the current response (faster
  feedback).
- **followUp** — annotations queue after the current response finishes
  (non-blocking).

## Editing

Edit the file directly or set values via the tool parameters:

```
review({ ref: "main", staged: true })
```
