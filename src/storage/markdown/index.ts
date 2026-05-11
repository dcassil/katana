import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import matter from "gray-matter";
import type { Document, Frontmatter } from "../../types/document.js";

/** Deterministic field order for serialized frontmatter. */
const FIELD_ORDER: (keyof Frontmatter)[] = [
  "id", "level", "title", "short_code", "subtype",
  "parent", "story_id", "scaffold_task",
  "pass", "model_tier",
  "created_at", "updated_at",
  "archived", "tags", "exit_criteria_met", "phase",
  "blocked_by", "strategy_id", "initiative_id",
];

export function computeHash(content: string): string {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

export function readMarkdown(filepath: string): Document {
  const raw = fs.readFileSync(filepath, "utf8");
  const parsed = matter(raw);
  const fm = parsed.data as Frontmatter;
  return {
    frontmatter: fm,
    body: parsed.content.replace(/^\n/, ""),
    filepath,
    file_hash: computeHash(raw),
  };
}

/** Serialize frontmatter in canonical order; trim and ensure trailing newline. */
export function serialize(fm: Frontmatter, body: string): string {
  const ordered: Record<string, unknown> = {};
  for (const k of FIELD_ORDER) {
    if (fm[k] !== undefined) ordered[k] = fm[k];
  }
  // gray-matter.stringify emits valid YAML frontmatter.
  const out = matter.stringify(body.endsWith("\n") ? body : body + "\n", ordered, {
    // gray-matter passes engine options through; default js-yaml is fine.
  });
  return out;
}

export function writeMarkdown(filepath: string, fm: Frontmatter, body: string): { file_hash: string; bytesWritten: number } {
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  const text = serialize(fm, body);
  fs.writeFileSync(filepath, text, "utf8");
  return { file_hash: computeHash(text), bytesWritten: Buffer.byteLength(text, "utf8") };
}
