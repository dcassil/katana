import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadDocument } from "../../src/gates/loader.js";
import { createContext } from "../../src/gates/context.js";
import type { KatanaDocument, GateContext } from "../../src/gates/types.js";

export const FIXTURES_ROOT = "/Users/danielcassil/Code/katana/tests/fixtures/gates";

export function loadAllPassFixtures(): KatanaDocument[] {
  const dir = join(FIXTURES_ROOT, "pass");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => loadDocument(join(dir, f)));
}

export interface FailFixture {
  path: string;
  doc: KatanaDocument;
  expectedGate: string;
  expectedCode: string;
}

export function loadAllFailFixtures(): FailFixture[] {
  const dir = join(FIXTURES_ROOT, "fail");
  const out: FailFixture[] = [];
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".md")) continue;
    const path = join(dir, f);
    const raw = readFileSync(path, "utf8");
    const gateMatch = /<!--\s*expected-gate:\s*(\S+)\s*-->/.exec(raw);
    const codeMatch = /<!--\s*expected-code:\s*(\S+)\s*-->/.exec(raw);
    if (!gateMatch || !codeMatch) {
      // Support fixtures (e.g. a parent referenced by another fail fixture)
      // intentionally omit the markers — they aren't standalone test cases.
      continue;
    }
    out.push({
      path,
      doc: loadDocument(path),
      expectedGate: gateMatch[1]!,
      expectedCode: codeMatch[1]!,
    });
  }
  return out;
}

/** Every .md under fail/, including support fixtures without marker comments. */
function loadAllFailDocs(): KatanaDocument[] {
  const dir = join(FIXTURES_ROOT, "fail");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => loadDocument(join(dir, f)));
}

export function ctxFromAll(): GateContext {
  return createContext([...loadAllPassFixtures(), ...loadAllFailDocs()]);
}
