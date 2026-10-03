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
  const allowed = new Set(["ref", "staged", "delivery"]);
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) throw new Error(`Unknown configuration field: ${key}`);
  }
  const ref = typeof obj.ref === "string" ? obj.ref : DEFAULT_CONFIG.ref;
  const staged = typeof obj.staged === "boolean" ? obj.staged : DEFAULT_CONFIG.staged;
  const delivery: Delivery =
    obj.delivery === "steer" || obj.delivery === "followUp"
      ? obj.delivery
      : DEFAULT_CONFIG.delivery;
  return { ref, staged, delivery };
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
