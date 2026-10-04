import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { DEFAULT_CONFIG, CONFIG_FILENAME, type Config, type Delivery } from "./contract.ts";

export function getConfigPath(agentDir: string): string {
  return join(agentDir, CONFIG_FILENAME);
}

export function parseConfig(value: unknown): Config {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Configuration must be a JSON object");
  }
  const obj = value as Record<string, unknown>;
  const allowed = new Set(["ref", "staged", "delivery", "shortcut"]);
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) throw new Error(`Unknown configuration field: ${key}`);
  }
  const ref = typeof obj.ref === "string" ? obj.ref : DEFAULT_CONFIG.ref;
  const staged = typeof obj.staged === "boolean" ? obj.staged : DEFAULT_CONFIG.staged;
  const delivery: Delivery =
    obj.delivery === "steer" || obj.delivery === "followUp"
      ? obj.delivery
      : DEFAULT_CONFIG.delivery;
  const shortcut =
    typeof obj.shortcut === "string" && isValidShortcut(obj.shortcut)
      ? obj.shortcut
      : DEFAULT_CONFIG.shortcut;
  return { ref, staged, delivery, shortcut };
}

const SPECIAL_KEYS = new Set([
  "escape", "esc", "enter", "return", "tab", "space",
  "backspace", "delete", "insert", "clear",
  "home", "end", "pageUp", "pageDown",
  "up", "down", "left", "right",
  "f1", "f2", "f3", "f4", "f5", "f6",
  "f7", "f8", "f9", "f10", "f11", "f12",
]);

const MODIFIERS = ["ctrl", "shift", "alt", "super"] as const;
const MODIFIER_SET = new Set(MODIFIERS);

function isValidShortcut(value: string): boolean {
  const parts = value.toLowerCase().split("+");
  if (parts.length < 2) return false;
  const base = parts[parts.length - 1]!;
  const mods = parts.slice(0, -1);

  // Base must be a single letter, digit, symbol, or special key name
  const isSingleChar = base.length === 1 && /^\S$/.test(base);
  const isSpecial = SPECIAL_KEYS.has(base);
  if (!isSingleChar && !isSpecial) return false;

  // All parts except base must be valid modifiers
  if (!mods.every((m) => MODIFIER_SET.has(m as any))) return false;

  // No duplicate modifiers
  if (new Set(mods).size !== mods.length) return false;

  // Modifiers must be in canonical order: ctrl, shift, alt, super
  const order = mods.map((m) => MODIFIERS.indexOf(m as any));
  for (let i = 1; i < order.length; i++) {
    if (order[i]! < order[i - 1]!) return false;
  }

  return true;
}

export async function loadConfig(path: string): Promise<Config> {
  try {
    const text = await readFile(path, "utf8");
    return parseConfig(JSON.parse(text));
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return { ...DEFAULT_CONFIG };
    }
    throw new Error(
      `Cannot load ${path}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export async function saveConfig(path: string, config: Config): Promise<void> {
  const text = `${JSON.stringify(config, null, 2)}\n`;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, text, { encoding: "utf8", mode: 0o600 });
}
