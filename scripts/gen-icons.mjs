// Generates PWA icons as PNGs with no external deps (raw RGBA -> zlib -> PNG).
// Draws a 3D-beveled Tetris "T" piece on the game's dark background.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const BG = [0x09, 0x09, 0x0b];
// main / light(top-left bevel) / dark(bottom-right bevel), matching src/game/constants.ts
const CELLS = [
  { c: [0, 0], main: [0x00, 0xff, 0xff], light: [0x88, 0xff, 0xff], dark: [0x00, 0x88, 0x88] }, // I cyan
  { c: [1, 0], main: [0xaa, 0x00, 0xff], light: [0xd4, 0x88, 0xff], dark: [0x55, 0x00, 0x88] }, // T purple
  { c: [2, 0], main: [0xff, 0x88, 0x00], light: [0xff, 0xbb, 0x66], dark: [0x88, 0x44, 0x00] }, // L orange
  { c: [1, 1], main: [0x00, 0xff, 0x00], light: [0x88, 0xff, 0x88], dark: [0x00, 0x88, 0x00] }, // S green
];
const GRID_W = 3, GRID_H = 2;

function makeImage(size, { transparentBg = false } = {}) {
  const px = Buffer.alloc(size * size * 4);
  const set = (x, y, rgb, a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    px[i] = rgb[0]; px[i + 1] = rgb[1]; px[i + 2] = rgb[2]; px[i + 3] = a;
  };

  // background
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) set(x, y, BG, transparentBg ? 0 : 255);

  // piece geometry: keep well inside the maskable safe zone (~central 66%)
  const cell = Math.round(size * 0.2);
  const gap = Math.max(2, Math.round(size * 0.012));
  const bevel = Math.max(3, Math.round(cell * 0.16));
  const totalW = GRID_W * cell, totalH = GRID_H * cell;
  const ox = Math.round((size - totalW) / 2);
  const oy = Math.round((size - totalH) / 2);

  for (const { c, main, light, dark } of CELLS) {
    const bx = ox + c[0] * cell + gap;
    const by = oy + c[1] * cell + gap;
    const s = cell - gap * 2;
    for (let dy = 0; dy < s; dy++) {
      for (let dx = 0; dx < s; dx++) {
        let rgb = main;
        const fromTL = Math.min(dx, dy);
        const fromBR = Math.min(s - 1 - dx, s - 1 - dy);
        if (fromTL < bevel && fromTL <= fromBR) rgb = light;
        else if (fromBR < bevel) rgb = dark;
        set(bx + dx, by + dy, rgb);
      }
    }
  }
  return px;
}

function encodePng(size, rgba) {
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const tc = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(tc) >>> 0, 0);
    return Buffer.concat([len, tc, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit, RGBA
  // add filter byte (0) per scanline
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return ~c;
}

mkdirSync('public/icons', { recursive: true });
const out = [
  ['public/icons/icon-192.png', 192, {}],
  ['public/icons/icon-512.png', 512, {}],
  ['public/icons/maskable-512.png', 512, {}], // solid bg -> safe as maskable
  ['public/icons/apple-touch-icon.png', 180, {}],
];
for (const [file, size, opts] of out) {
  writeFileSync(file, encodePng(size, makeImage(size, opts)));
  console.log('wrote', file, size + 'x' + size);
}
