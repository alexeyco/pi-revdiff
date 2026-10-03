import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseConfig } from "../src/config.ts";
import { DEFAULT_CONFIG } from "../src/contract.ts";

describe("parseConfig", () => {
  it("returns defaults for an empty object", () => {
    const config = parseConfig({});
    assert.deepStrictEqual(config, DEFAULT_CONFIG);
  });

  it("accepts valid ref", () => {
    const config = parseConfig({ ref: "main" });
    assert.strictEqual(config.ref, "main");
  });

  it("accepts valid staged boolean", () => {
    const config = parseConfig({ staged: true });
    assert.strictEqual(config.staged, true);
  });

  it("accepts valid delivery mode", () => {
    const config = parseConfig({ delivery: "followUp" });
    assert.strictEqual(config.delivery, "followUp");
  });

  it("rejects non-object input", () => {
    assert.throws(() => parseConfig(null), /must be a JSON object/);
    assert.throws(() => parseConfig("string"), /must be a JSON object/);
    assert.throws(() => parseConfig([]), /must be a JSON object/);
  });

  it("rejects unknown fields", () => {
    assert.throws(() => parseConfig({ unknown: true }), /Unknown configuration field/);
  });

  it("ignores invalid delivery values, falls back to default", () => {
    const config = parseConfig({ delivery: "invalid" });
    assert.strictEqual(config.delivery, DEFAULT_CONFIG.delivery);
  });

  it("ignores non-string ref, falls back to default", () => {
    const config = parseConfig({ ref: 42 });
    assert.strictEqual(config.ref, DEFAULT_CONFIG.ref);
  });

  it("ignores non-boolean staged, falls back to default", () => {
    const config = parseConfig({ staged: "yes" });
    assert.strictEqual(config.staged, DEFAULT_CONFIG.staged);
  });

  it("merges partial config with defaults", () => {
    const config = parseConfig({ ref: "develop", staged: true });
    assert.strictEqual(config.ref, "develop");
    assert.strictEqual(config.staged, true);
    assert.strictEqual(config.delivery, DEFAULT_CONFIG.delivery);
  });
});
