import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getAdapter,
  listPlatforms,
  registerAdapter,
  UnknownPlatformError,
} from "../../src/platform/registry";
import type { PlatformId } from "../../src/platform/port";

describe("Adapter Registry", () => {
  const originalRegistry: Record<PlatformId, () => any> = {};

  beforeEach(() => {
    // Save original state for restoration
    listPlatforms().forEach((id) => {
      originalRegistry[id] = getAdapter(id);
    });
  });

  afterEach(() => {
    // Restore original state
    Object.entries(originalRegistry).forEach(([id, adapter]) => {
      registerAdapter(id as PlatformId, () => adapter);
    });
  });

  it('getAdapter("claude-code").id === "claude-code"', () => {
    const adapter = getAdapter("claude-code");
    expect(adapter.id).toBe("claude-code");
  });

  it('getAdapter("cursor").id === "cursor"', () => {
    const adapter = getAdapter("cursor");
    expect(adapter.id).toBe("cursor");
  });

  it('getAdapter("openai-codex").id === "openai-codex"', () => {
    const adapter = getAdapter("openai-codex");
    expect(adapter.id).toBe("openai-codex");
  });

  it('getAdapter("nope") throws UnknownPlatformError', () => {
    expect(() => getAdapter("nope" as PlatformId)).toThrow(UnknownPlatformError);
  });

  it("UnknownPlatformError message includes known platforms", () => {
    try {
      getAdapter("invalid" as PlatformId);
      expect.fail("Should have thrown UnknownPlatformError");
    } catch (error) {
      expect(error).toBeInstanceOf(UnknownPlatformError);
      expect((error as Error).message).toContain("claude-code");
      expect((error as Error).message).toContain("cursor");
      expect((error as Error).message).toContain("openai-codex");
    }
  });

  it("listPlatforms() returns all three ids in stable insertion order", () => {
    const platforms = listPlatforms();
    expect(platforms).toEqual(["claude-code", "cursor", "openai-codex"]);
  });

  it("registerAdapter allows test stub override", () => {
    const stubFactory = () => ({
      id: "claude-code" as const,
      install: async () => ({ platform: "claude-code" as const, files: [], mcpRegistered: false, commands: [], warnings: [] }),
      uninstall: async () => ({ platform: "claude-code" as const, files: [], mcpRegistered: false, commands: [], warnings: [] }),
      registerCommand: async () => [],
      registerRule: async () => [],
      generateAgentDoc: async () => ({ path: "", action: "skipped" as const, bytes: 0 }),
    });

    registerAdapter("claude-code", stubFactory);
    const adapter = getAdapter("claude-code");
    expect(adapter.id).toBe("claude-code");
  });

  it("factory returns a fresh instance per call", () => {
    const adapter1 = getAdapter("claude-code");
    const adapter2 = getAdapter("claude-code");
    expect(adapter1).not.toBe(adapter2);
    expect(adapter1.id).toBe(adapter2.id);
  });
});
