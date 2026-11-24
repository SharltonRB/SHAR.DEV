import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../..", import.meta.url));
const tsx = join(root, "node_modules/.bin/tsx");
const dir = mkdtempSync(join(tmpdir(), "content-import-"));

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

/** Runs the script with a fake database URL it must never reach. */
function runImport(path: string) {
  const result = spawnSync(tsx, ["scripts/content-import.ts", path], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      DATABASE_URL: "postgresql://user:pass@127.0.0.1:1/unreachable",
    },
    timeout: 30_000,
  });
  return { status: result.status, stderr: result.stderr };
}

describe("content:import script (US6-5)", () => {
  it("a path that does not exist exits non-zero naming the reason", () => {
    const { status, stderr } = runImport(join(dir, "missing.json"));

    expect(status).not.toBe(0);
    expect(stderr).toContain("File not found");
    expect(stderr).not.toContain("Import failed");
  });

  it("a file that is not JSON exits non-zero naming the reason", () => {
    const path = join(dir, "broken.json");
    writeFileSync(path, "{ not json");

    const { status, stderr } = runImport(path);

    expect(status).not.toBe(0);
    expect(stderr).toContain("is not valid JSON");
    expect(stderr).not.toContain("Import failed");
  });
});
