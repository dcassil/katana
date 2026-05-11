import type { BoardPort } from "../../src/board/port.js";

/** Type-level test: both internal and external backends must be assignable to BoardPort.
 *  This compiles only; no runtime assertions. Guarded by describe.skip until
 *  KAT-T-0122 (InternalBoardPort) and KAT-T-0124 (stub backend) are implemented. */

// @ts-expect-error - InternalBoardPort not yet implemented
const _internalBackend: BoardPort = new InternalBoardPort({
  workspace_root: "/path/to/.katana",
});

// @ts-expect-error - ExternalBoardPort not yet implemented
const _externalBackend: BoardPort = new ExternalBoardPort({
  workspace_root: "/path/to/.katana",
});
