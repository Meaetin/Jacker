// Draws the extension icons from scratch, so the repo carries no binary blob
// nobody can edit. Chrome needs a real PNG for the toolbar and for every
// notification the background script raises.
//
//   node scripts/generate-extension-icons.mjs

import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "chrome-extension", "icons");

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, checksum]);
}

function encodePng(size, sample) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  let cursor = 0;

  for (let y = 0; y < size; y += 1) {
    raw[cursor] = 0; // filter type: none
    cursor += 1;
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = sample(x, y);
      raw[cursor] = r;
      raw[cursor + 1] = g;
      raw[cursor + 2] = b;
      raw[cursor + 3] = a;
      cursor += 4;
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // colour type: RGBA
  // bytes 10-12 stay zero: deflate, adaptive filtering, no interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// Distance-based rounded rectangle: clamp the point into the inner rectangle,
// then anything within the corner radius of that point is inside the shape.
function insideRounded(x, y, left, top, right, bottom, radius) {
  const cx = Math.min(Math.max(x, left + radius), right - radius);
  const cy = Math.min(Math.max(y, top + radius), bottom - radius);
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}

const BRAND = [37, 99, 235];
const BARS = [
  { top: 0.3, bottom: 0.4, left: 0.22, right: 0.78 },
  { top: 0.46, bottom: 0.56, left: 0.22, right: 0.78 },
  { top: 0.62, bottom: 0.72, left: 0.22, right: 0.56 },
];

// A form with filled-in rows: three bars, the last one short as if mid-typing.
function drawIcon(size) {
  const SUPERSAMPLE = 3;

  return (x, y) => {
    let inside = 0;
    let onBar = 0;

    for (let sy = 0; sy < SUPERSAMPLE; sy += 1) {
      for (let sx = 0; sx < SUPERSAMPLE; sx += 1) {
        const px = (x + (sx + 0.5) / SUPERSAMPLE) / size;
        const py = (y + (sy + 0.5) / SUPERSAMPLE) / size;

        if (!insideRounded(px, py, 0.02, 0.02, 0.98, 0.98, 0.22)) continue;
        inside += 1;

        for (const bar of BARS) {
          if (insideRounded(px, py, bar.left, bar.top, bar.right, bar.bottom, 0.05)) {
            onBar += 1;
            break;
          }
        }
      }
    }

    const total = SUPERSAMPLE * SUPERSAMPLE;
    if (!inside) return [0, 0, 0, 0];

    const barRatio = onBar / inside;
    const alpha = Math.round((inside / total) * 255);
    const colour = BRAND.map((channel) => Math.round(channel + (255 - channel) * barRatio));

    return [...colour, alpha];
  };
}

mkdirSync(OUT_DIR, { recursive: true });

for (const size of [16, 48, 128]) {
  const file = resolve(OUT_DIR, `icon${size}.png`);
  writeFileSync(file, encodePng(size, drawIcon(size)));
  console.log(`wrote ${file}`);
}
