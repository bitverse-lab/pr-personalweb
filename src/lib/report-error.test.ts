import { afterEach, describe, expect, it, vi } from "vitest";
import { reportError, safeErrorType } from "./report-error";

describe("privacy-safe error reporting", () => {
  afterEach(() => vi.restoreAllMocks());

  it("reports only the allowlisted error type", () => {
    expect(safeErrorType(new TypeError("private journal text"))).toBe("TypeError");
    expect(safeErrorType(new Error("owner@example.com"))).toBe("Error");
    expect(safeErrorType({ name: "DatabaseError", message: "contact message" })).toBe("UnknownError");
  });

  it("does not log exception messages, stacks, or arbitrary error names", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

    reportError("storage-cleanup", Object.assign(new Error("private-docs/owner/file.pdf"), { name: "StorageError" }));

    expect(log).toHaveBeenCalledOnce();
    const output = String(log.mock.calls[0][0]);
    expect(output).toContain('"area":"storage-cleanup"');
    expect(output).toContain('"errorType":"UnknownError"');
    expect(output).not.toContain("private-docs");
    expect(output).not.toContain("file.pdf");
  });
});
