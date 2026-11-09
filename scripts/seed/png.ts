import { crc32, deflateSync } from "node:zlib";

// Fronter palette (src/styles/legacy/scss/_variables.scss) so demo covers sit naturally on the site.
const PALETTE: [number, number, number][] = [
  [0x2a, 0x52, 0xc3], // primary
  [0x5a, 0x6d, 0x90], // secondary
  [0x1c, 0xb5, 0x9f], // success
  [0xfa, 0x69, 0x3e], // warning
  [0x3c, 0x48, 0x58], // dark
  [0xf8, 0xf9, 0xfc], // light
];

// Small deterministic PRNG (mulberry32) so a seed always yields the same image.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const v = new DataView(out.buffer);
  v.setUint32(0, data.length);
  out.set(Buffer.from(type, "ascii"), 4);
  out.set(data, 8);
  v.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

/**
 * Abstract, text-free demo image: a diagonal two-tone gradient crossed by a few translucent
 * bands. 8-bit RGB PNG, rows use the Sub filter so smooth gradients compress well below the
 * app's 5 MB image cap.
 */
export function placeholderPng(opts: { width: number; height: number; seed: number }): Uint8Array {
  const { width, height, seed } = opts;
  const rand = rng(seed);
  const pick = () => PALETTE[Math.floor(rand() * (PALETTE.length - 1))]; // never the near-white light as a base
  const from = pick();
  let to = pick();
  if (to === from) to = PALETTE[(PALETTE.indexOf(from) + 1) % (PALETTE.length - 1)];
  const bands = Array.from({ length: 2 + Math.floor(rand() * 3) }, () => ({
    angle: rand() * Math.PI,
    offset: rand(),
    width: 0.04 + rand() * 0.12,
    alpha: 0.12 + rand() * 0.18,
  }));

  const stride = 1 + width * 3;
  const raw = new Uint8Array(height * stride);
  const row = new Uint8Array(width * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const t = (x / width + y / height) / 2;
      let r = from[0] + (to[0] - from[0]) * t;
      let g = from[1] + (to[1] - from[1]) * t;
      let b = from[2] + (to[2] - from[2]) * t;
      for (const band of bands) {
        const d = Math.abs((x / width) * Math.cos(band.angle) + (y / height) * Math.sin(band.angle) - band.offset);
        if (d < band.width) {
          r += (255 - r) * band.alpha;
          g += (255 - g) * band.alpha;
          b += (255 - b) * band.alpha;
        }
      }
      row[x * 3] = r;
      row[x * 3 + 1] = g;
      row[x * 3 + 2] = b;
    }
    const at = y * stride;
    raw[at] = 1; // Sub filter
    for (let i = 0; i < row.length; i++) raw[at + 1 + i] = (row[i] - (i >= 3 ? row[i - 3] : 0)) & 0xff;
  }

  const ihdr = new Uint8Array(13);
  const h = new DataView(ihdr.buffer);
  h.setUint32(0, width);
  h.setUint32(4, height);
  ihdr.set([8, 2, 0, 0, 0], 8); // 8-bit, truecolour RGB, deflate, adaptive filtering, no interlace

  const parts = [
    Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", new Uint8Array(0)),
  ];
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}
