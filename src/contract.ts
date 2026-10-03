export type Delivery = "steer" | "followUp";

export interface Config {
  readonly ref: string;
  readonly staged: boolean;
  readonly delivery: Delivery;
}

export const DEFAULT_CONFIG: Config = Object.freeze({
  ref: "HEAD",
  staged: false,
  delivery: "steer",
});

export const CONFIG_FILENAME = "pi-revdiff.json";

export interface RevdiffResult {
  readonly annotations: string;
}
