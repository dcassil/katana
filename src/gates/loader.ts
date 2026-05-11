import { readFileSync } from "node:fs";
import { parse as parseYaml } from "yaml";
import type {
  DocumentFrontmatter,
  DocumentSection,
  KatanaDocument,
} from "./types.js";

/** Frontmatter delimiter regex. The opening `---` must start at file column 0. */
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

/** Heading regex. Matches `## Heading` or `### Heading`. */
const HEADING_RE = /^(#{2,6})\s+(.+?)\s*$/;

/**
 * Read a file from disk and parse into a KatanaDocument.
 * Throws if the file cannot be read.
 * Does NOT throw on malformed frontmatter — emits an empty frontmatter object.
 */
export function loadDocument(path: string): KatanaDocument {
  const raw = readFileSync(path, "utf8");
  return parseDocument(path, raw);
}

/**
 * Parse already-read file contents into a KatanaDocument.
 * Pure; no I/O.
 */
export function parseDocument(path: string, raw: string): KatanaDocument {
  const match = FRONTMATTER_RE.exec(raw);
  let frontmatter: DocumentFrontmatter = {};
  let body = raw;
  if (match) {
    const yamlBlock = match[1] ?? "";
    body = match[2] ?? "";
    try {
      const parsed = parseYaml(yamlBlock);
      if (parsed && typeof parsed === "object") {
        frontmatter = parsed as DocumentFrontmatter;
      }
    } catch {
      // Malformed YAML: leave frontmatter as {}; gates will flag it.
    }
  }
  const sections = parseSections(body);
  return { path, raw, frontmatter, body, sections };
}

/**
 * Split a markdown body into sections by `##` and deeper headings.
 * A section's body extends until the next heading of equal or shallower depth.
 */
export function parseSections(body: string): DocumentSection[] {
  const lines = body.split(/\r?\n/);
  const sections: DocumentSection[] = [];
  let current: { heading: string; depth: number; bodyLines: string[] } | null = null;
  for (const line of lines) {
    const m = HEADING_RE.exec(line);
    if (m) {
      if (current) {
        sections.push({
          heading: current.heading,
          depth: current.depth,
          body: current.bodyLines.join("\n").trim(),
        });
      }
      current = {
        heading: m[2]!,
        depth: m[1]!.length,
        bodyLines: [],
      };
    } else if (current) {
      current.bodyLines.push(line);
    }
  }
  if (current) {
    sections.push({
      heading: current.heading,
      depth: current.depth,
      body: current.bodyLines.join("\n").trim(),
    });
  }
  return sections;
}
