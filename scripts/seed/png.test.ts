import { crc32, inflateSync } from "node:zlib";
import { expect, test } from "vitest";
import { kindOfMime, MAX_IMAGE_BYTES, sniffMime } from "../../src/features/media/rules";
import { placeholderPng } from "./png";

const same = (a: Uint8Array, b: Uint8Array) => Buffer.from(a).equals(Buffer.from(b));

test("placeholder passes the app's own upload rules", () => {
  const png = placeholderPng({ width: 1600, height: 1000, seed: 3 });
  expect(sniffMime(png)).toBe("image/png");
  expect(kindOfMime("image/png")).toBe("image");
  expect(png.byteLength).toBeLessThanOrEqual(MAX_IMAGE_BYTES);
});

test("output is deterministic per seed and differs between seeds", () => {
  const a = placeholderPng({ width: 1600, height: 1000, seed: 3 });
  expect(same(a, placeholderPng({ width: 1600, height: 1000, seed: 3 }))).toBe(true);
  expect(same(a, placeholderPng({ width: 1600, height: 1000, seed: 4 }))).toBe(false);
});

test("dimensions are written to IHDR and the pixel data is complete", () => {
  const png = placeholderPng({ width: 160, height: 90, seed: 1 });
  const v = new DataView(png.buffer, png.byteOffset, png.byteLength);
  expect([v.getUint32(16), v.getUint32(20)]).toEqual([160, 90]);
  expect([png[24], png[25]]).toEqual([8, 2]); // 8-bit RGB

  // IDAT starts after signature (8) + IHDR chunk (25); decompressed size = rows * (filter byte + 3 * width)
  const idatLen = v.getUint32(33);
  expect(String.fromCharCode(...Array.from(png.slice(37, 41)))).toBe("IDAT");
  expect(inflateSync(png.slice(41, 41 + idatLen)).length).toBe(90 * (1 + 3 * 160));
});

test("every chunk CRC matches zlib's crc32 and the file ends with IEND", () => {
  const png = placeholderPng({ width: 16, height: 16, seed: 2 });
  const v = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const types: string[] = [];
  for (let at = 8; at < png.length; ) {
    const len = v.getUint32(at);
    const typeAndData = png.slice(at + 4, at + 8 + len);
    types.push(String.fromCharCode(...Array.from(typeAndData.slice(0, 4))));
    expect(v.getUint32(at + 8 + len)).toBe(crc32(typeAndData));
    at += 12 + len;
  }
  expect(types).toEqual(["IHDR", "IDAT", "IEND"]);
});
