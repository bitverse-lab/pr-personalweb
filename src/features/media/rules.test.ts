import { describe, expect, it } from "vitest";
import { extFor, formatBytes, kindOfMime, maxBytesFor, sanitizeName, sniffMime } from "./rules";

const pad = (...b: number[]) => new Uint8Array([...b, ...new Array(24).fill(0)]);
const text = (s: string) => new Uint8Array([...Array.from(Buffer.from(s, "latin1")), ...new Array(24).fill(0)]);

describe("sniffMime (file content, never the declared type)", () => {
  it("recognises supported images and documents", () => {
    expect(sniffMime(pad(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(sniffMime(pad(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("image/png");
    expect(sniffMime(text("GIF89a"))).toBe("image/gif");
    expect(sniffMime(text("GIF87a"))).toBe("image/gif");
    expect(sniffMime(text("RIFF\0\0\0\0WEBPVP8 "))).toBe("image/webp");
    expect(sniffMime(text("%PDF-1.7\n"))).toBe("application/pdf");
    expect(sniffMime(text("PK\u0003\u0004 ...word/document.xml..."))).toContain("wordprocessingml");
  });

  it("rejects everything else, including active content", () => {
    expect(sniffMime(text("<svg xmlns='http://www.w3.org/2000/svg'><script>1</script></svg>"))).toBeNull();
    expect(sniffMime(text("<!doctype html><script>alert(1)</script>"))).toBeNull();
    expect(sniffMime(text("MZ\u0090\u0000\u0003"))).toBeNull(); // Windows executable
    expect(sniffMime(text("PK\u0003\u0004 archive.txt"))).toBeNull(); // a zip that is not a .docx
    expect(sniffMime(new Uint8Array([1, 2, 3]))).toBeNull(); // too short to identify
  });
});

describe("type and size rules", () => {
  it("maps mime types to kinds and extensions", () => {
    expect(kindOfMime("image/png")).toBe("image");
    expect(kindOfMime("application/pdf")).toBe("document");
    for (const bad of ["image/svg+xml", "text/html", "application/x-msdownload", ""]) expect(kindOfMime(bad)).toBeNull();
    expect(extFor("image/jpeg")).toBe("jpg");
    expect(extFor("application/pdf")).toBe("pdf");
    expect(extFor("text/html")).toBeNull();
  });

  it("limits images to 5 MB and documents to 10 MB", () => {
    expect(maxBytesFor("image")).toBe(5 * 1024 * 1024);
    expect(maxBytesFor("document")).toBe(10 * 1024 * 1024);
  });

  it("sanitises display names (never used for storage keys)", () => {
    expect(sanitizeName("../../etc/passwd")).toBe("passwd");
    expect(sanitizeName("C:\\Users\\me\\cv<1>.pdf")).toBe("cv1.pdf");
    expect(sanitizeName("")).toBe("file");
    expect(sanitizeName("x".repeat(500)).length).toBe(120);
  });

  it("formats sizes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});
