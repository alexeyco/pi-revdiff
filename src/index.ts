/**
 * @alexeyco/pi-revdiff
 *
 * Pi extension that registers a `review` tool and a `Ctrl+R` shortcut. Launches the revdiff TUI directly as a child process,
 * captures annotations via `-o` temp file, and delivers them back to the agent.
 *
 * TUI takeover uses ctx.ui.custom() — tui.stop() before spawn, tui.start()
 * on child exit — the same pattern as pi-hunk.
 */
import { Type } from "@earendil-works/pi-ai";
import {
  defineTool,
  type ExtensionAPI,
  type ExtensionContext,
  type ExtensionToolContext,
} from "@earendil-works/pi-coding-agent";
import { Key } from "@earendil-works/pi-tui";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { getConfigPath, loadConfig, saveConfig } from "./config.ts";
import { DEFAULT_CONFIG, type Config, type Delivery } from "./contract.ts";

function getAgentDir(): string {
  const home = process.env.HOME ?? process.env.USERPROFILE ?? "~";
  return join(home, ".pi", "agent");
}

// ── Terminal helpers ─────────────────────────────────────────────────────

interface ChildResult {
  code: number | null;
  annotations: string;
}

function execAsync(
  cmd: string,
  args: string[],
  cwd: string,
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
    child.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

/**
 * Launch revdiff with full terminal takeover via ctx.ui.custom().
 * tui.stop() releases the terminal, revdiff gets stdio:inherit,
 * tui.start() restores Pi's TUI on exit.
 *
 * No timeout — killing revdiff loses the user's annotations.
 */
async function launchRevdiff(
  args: string[],
  cwd: string,
  ctx: ExtensionContext,
): Promise<ChildResult> {
  // Temporary directory for the annotation output file.
  const dir = await mkdtemp(join(tmpdir(), "pi-revdiff-"));
  const outputFile = join(dir, "annotations.md");
  await writeFile(outputFile, "", { mode: 0o600 });

  const fullArgs = [...args, "-o", outputFile];

  interface ExitInfo { code: number | null }

  const exit = await ctx.ui.custom<ExitInfo>(async (tui, _theme, _keys, done) => {
    // Release the terminal so revdiff can draw its full-screen TUI.
    tui.stop();

    const child = spawn("revdiff", fullArgs, {
      cwd,
      stdio: "inherit",
      env: { ...process.env, REVDIFF_EXIT_CODE_ON_ANNOTATIONS: "true" },
    });

    child.on("close", (code) => {
      // Restore Pi's TUI.
      tui.start();
      tui.requestRender(true);
      done({ code });
    });

    child.on("error", () => {
      tui.start();
      tui.requestRender(true);
      done({ code: 127 });
    });

    // Empty component — revdiff owns the screen.
    return {
      render: () => [],
      invalidate: () => {},
      handleInput: () => {},
    };
  });

  let annotations = "";
  try {
    annotations = (await readFile(outputFile, "utf8")).trim();
  } catch {
    // Output file may not exist if revdiff failed to start.
  }

  // Clean up temp directory.
  await rm(dir, { recursive: true, force: true });

  return { code: exit.code, annotations };
}

// ── Core logic ────────────────────────────────────────────────────────────

const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".ico", ".svg",
  ".pdf", ".zip", ".tar", ".gz", ".bz2", ".xz", ".7z", ".rar",
  ".exe", ".dll", ".so", ".dylib", ".bin", ".o", ".obj", ".class", ".pyc",
  ".woff", ".woff2", ".ttf", ".eot",
  ".mp3", ".mp4", ".avi", ".mov", ".mkv", ".webm",
]);

function isTextFile(filePath: string): boolean {
  const dot = filePath.lastIndexOf(".");
  if (dot === -1) return true;
  return !BINARY_EXTENSIONS.has(filePath.substring(dot).toLowerCase());
}

interface RevdiffParams {
  ref?: string;
  staged?: boolean;
  only?: string[];
}

function buildArgs(input: RevdiffParams): string[] {
  return [
    ...(input.ref ? [input.ref] : []),
    ...(input.staged ? ["--staged"] : []),
    ...(input.only?.map((f) => `--only=${f}`) ?? []),
  ];
}

interface ReviewResult {
  text: string;
  hasAnnotations: boolean;
}

/**
 * Stage files, build revdiff args, launch TUI, read annotations.
 */
async function executeReview(
  ctx: ExtensionContext,
  input: RevdiffParams,
): Promise<ReviewResult> {
  if (ctx.mode !== "tui") {
    return { text: "revdiff requires an interactive TUI session.", hasAnnotations: false };
  }

  const cwd = ctx.cwd;

  // Detect git repository.
  const gitCheck = await execAsync("git", ["rev-parse", "--is-inside-work-tree"], cwd);
  const inGitRepo = gitCheck.code === 0;

  let args: string[];
  let stagingReport = "";

  if (inGitRepo) {
    // Stage all changes.
    await execAsync("git", ["add", "-A"], cwd);

    const staged = await execAsync("git", ["diff", "--cached", "--name-only"], cwd);
    const stagedList = staged.stdout.trim();

    const quiet = await execAsync("git", ["diff", "--cached", "--quiet"], cwd);
    const nothingStaged = quiet.code === 0;

    stagingReport = stagedList ? `Staged files:\n${stagedList}` : "Staged files: (none)";

    if (nothingStaged && !input.ref) {
      args = ["--all-files"];
    } else {
      const hasStagedFiles = stagedList.length > 0;
      args = buildArgs({ ...input, staged: input.staged ?? hasStagedFiles });
    }
  } else {
    // Non-git: enumerate text files.
    const fd = await execAsync(
      "fd", ["--type", "f", "--max-results", "200", "--print0"], cwd,
    );

    if (fd.code !== 0 || !fd.stdout.trim()) {
      return { text: "No files found to review.", hasAnnotations: false };
    }

    const files = fd.stdout.split("\0").filter((f) => f.trim() !== "" && isTextFile(f));
    if (files.length === 0) {
      return { text: "No text files found to review.", hasAnnotations: false };
    }

    args = files.map((f) => `--only=${f}`);
    stagingReport = `Non-git directory: reviewing ${files.length} file(s).`;
  }

  // Launch revdiff with full TUI takeover.
  const result = await launchRevdiff(args, cwd, ctx);

  if (result.code === 127) {
    return {
      text: "revdiff is not installed or not found on PATH. Install it from https://github.com/umputun/revdiff",
      hasAnnotations: false,
    };
  }

  // Exit 0 = no annotations, 10 = annotations captured, other = error.
  const success = result.code === 0 || result.code === 10;
  if (!success) {
    return {
      text: `${stagingReport}\nrevdiff exited with code ${result.code}`,
      hasAnnotations: false,
    };
  }

  const hasAnnotations = result.annotations.length > 0;
  const text = result.annotations || "(no annotations)";

  return {
    text: stagingReport ? `${stagingReport}\n\n${text}` : text,
    hasAnnotations,
  };
}

// ── Tool definition ────────────────────────────────────────────────────────

const REVDIFF_PARAMS = Type.Object({
  ref: Type.Optional(
    Type.String({
      description: "Git ref to diff against (e.g. HEAD, main, a commit SHA). Omit to diff working tree.",
    }),
  ),
  staged: Type.Optional(
    Type.Boolean({
      description: "Diff staged changes instead of working tree.",
    }),
  ),
  only: Type.Optional(
    Type.Array(Type.String(), {
      description: "Limit the diff to these file paths.",
    }),
  ),
});

interface ReviewDetails {
  tool: "review";
  annotationCount?: number;
  annotations?: string;
}

const reviewTool = defineTool({
  name: "review",
  label: "Review",
  description:
    "Launch an interactive diff review using revdiff. Opens a full-screen terminal overlay " +
    "where the user can scroll diffs and annotate lines. Returns the user's annotations " +
    "for you to address. Stages all changes (git add -A) before launching.",
  parameters: REVDIFF_PARAMS,

  async execute(
    _toolCallId: string,
    params: RevdiffParams,
    _signal: AbortSignal | undefined,
    _onUpdate: unknown,
    ctx: ExtensionToolContext,
  ): Promise<{ content: { type: "text"; text: string }[]; details: ReviewDetails }> {
    const result = await executeReview(ctx, params);

    if (!result.hasAnnotations) {
      return {
        content: [{ type: "text", text: result.text }],
        details: { tool: "review", annotationCount: 0 },
      };
    }

    const prompt = [
      "The user completed a diff review and left the following annotations:",
      "",
      result.text,
      "",
      "Carefully read each annotation and address it. For each one:",
      "1. Understand the concern",
      "2. Locate the relevant code",
      "3. Make the necessary changes or explain why no change is needed",
    ].join("\n");

    return {
      content: [{ type: "text", text: prompt }],
      details: { tool: "review", annotations: result.text },
    };
  },
});

// ── Extension entry ────────────────────────────────────────────────────────

export default function piRevdiff(pi: ExtensionAPI) {
  let config: Config = { ...DEFAULT_CONFIG };
  const configPath = getConfigPath(getAgentDir());

  pi.registerTool(reviewTool);

  pi.registerShortcut(Key.ctrl("r"), {
    description: "Launch interactive diff review",
    handler: async (ctx) => {
      if (ctx.mode !== "tui") {
        ctx.ui.notify("revdiff requires an interactive terminal", "warning");
        return;
      }
      const parts = ["Review the current changes using the review tool."];
      if (config.staged) parts.push("Focus on staged changes only.");
      else if (config.ref !== "HEAD") parts.push(`Compare against \`${config.ref}\`.`);
      parts.push(
        "After reviewing, carefully read and address every annotation the user left.",
        "For each annotation: understand the concern, locate the relevant code, and make the necessary changes.",
      );
      pi.sendUserMessage(parts.join(" "), { deliverAs: config.delivery });
    },
  });

  pi.on("session_start", async () => {
    try { config = await loadConfig(configPath); } catch { config = { ...DEFAULT_CONFIG }; }
  });
}
