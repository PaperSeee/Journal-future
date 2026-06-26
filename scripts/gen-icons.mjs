// Generates PWA PNG icons with no external deps, using a hand-rolled PNG
// encoder. Draws the HqGambler tile + a steel "HQ" monogram + diamond
// watermark. Run: node scripts/gen-icons.mjs
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, "..", "public");

// ── tiny PNG encoder (RGBA, 8-bit) ──
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  // rest 0
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── drawing helpers (super-sampled for clean edges) ──
function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lerp(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function render(size, { maskable = false } = {}) {
  const SS = 4; // supersample
  const W = size * SS;
  const px = Buffer.alloc(W * W * 4); // RGBA at supersample res

  const tileTop = hexToRgb("#1C2230");
  const tileBot = hexToRgb("#11141B");
  const accTop = hexToRgb("#6EC1F0");
  const accBot = hexToRgb("#2E6F9E");

  const radius = maskable ? W : W * 0.26; // maskable = full-bleed square-ish
  const pad = maskable ? 0 : 0;

  const set = (x, y, rgb, a = 255) => {
    if (x < 0 || y < 0 || x >= W || y >= W) return;
    const i = (y * W + x) * 4;
    const ia = a / 255;
    px[i] = Math.round(px[i] * (1 - ia) + rgb[0] * ia);
    px[i + 1] = Math.round(px[i + 1] * (1 - ia) + rgb[1] * ia);
    px[i + 2] = Math.round(px[i + 2] * (1 - ia) + rgb[2] * ia);
    px[i + 3] = Math.max(px[i + 3], a);
  };

  const inRoundRect = (x, y, x0, y0, x1, y1, r) => {
    if (x < x0 || x > x1 || y < y0 || y > y1) return false;
    const cx = Math.min(Math.max(x, x0 + r), x1 - r);
    const cy = Math.min(Math.max(y, y0 + r), y1 - r);
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy <= r * r;
  };

  // tile background with vertical gradient
  for (let y = 0; y < W; y++) {
    const t = y / W;
    const bg = lerp(tileTop, tileBot, t);
    for (let x = 0; x < W; x++) {
      if (inRoundRect(x, y, pad, pad, W - 1 - pad, W - 1 - pad, radius)) {
        set(x, y, bg, 255);
      }
    }
  }

  // accent gradient color at a point (diagonal)
  const acc = (x, y) => lerp(accTop, accBot, (x + y) / (2 * W));

  // diamond watermark (filled, low opacity)
  const cx = W / 2;
  const dia = (x, y) => {
    const dx = Math.abs(x - cx) / (W * 0.2);
    const dy = Math.abs(y - W / 2) / (W * 0.32);
    return dx + dy <= 1;
  };
  for (let y = 0; y < W; y++)
    for (let x = 0; x < W; x++) if (dia(x, y)) set(x, y, acc(x, y), 26);

  // strokes: H and Q drawn as thick line segments / ring
  const lw = W * 0.055;
  const drawSeg = (x0, y0, x1, y1) => {
    const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      for (let oy = -lw; oy <= lw; oy++)
        for (let ox = -lw; ox <= lw; ox++) {
          if (ox * ox + oy * oy <= lw * lw)
            set(Math.round(x + ox), Math.round(y + oy), acc(x, y), 255);
        }
    }
  };

  // H (left)
  const hx0 = W * 0.27;
  const hx1 = W * 0.44;
  const hy0 = W * 0.33;
  const hy1 = W * 0.67;
  drawSeg(hx0, hy0, hx0, hy1);
  drawSeg(hx1, hy0, hx1, hy1);
  drawSeg(hx0, (hy0 + hy1) / 2, hx1, (hy0 + hy1) / 2);

  // Q (right) — ring + tail
  const qcx = W * 0.66;
  const qcy = W / 2;
  const qr = W * 0.135;
  for (let a = 0; a < Math.PI * 2; a += 0.01) {
    const x = qcx + Math.cos(a) * qr;
    const y = qcy + Math.sin(a) * qr;
    for (let oy = -lw; oy <= lw; oy++)
      for (let ox = -lw; ox <= lw; ox++)
        if (ox * ox + oy * oy <= lw * lw)
          set(Math.round(x + ox), Math.round(y + oy), acc(x, y), 255);
  }
  drawSeg(qcx + qr * 0.4, qcy + qr * 0.4, qcx + qr * 1.05, qcy + qr * 1.05);

  // downsample SS×SS → size
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++)
        for (let sx = 0; sx < SS; sx++) {
          const i = ((y * SS + sy) * W + (x * SS + sx)) * 4;
          r += px[i]; g += px[i + 1]; b += px[i + 2]; a += px[i + 3];
        }
      const n = SS * SS;
      const o = (y * size + x) * 4;
      out[o] = Math.round(r / n);
      out[o + 1] = Math.round(g / n);
      out[o + 2] = Math.round(b / n);
      out[o + 3] = Math.round(a / n);
    }
  }
  return encodePng(size, size, out);
}

writeFileSync(join(PUBLIC, "icon-192.png"), render(192));
writeFileSync(join(PUBLIC, "icon-512.png"), render(512));
writeFileSync(join(PUBLIC, "icon-maskable-512.png"), render(512, { maskable: true }));
writeFileSync(join(PUBLIC, "apple-icon.png"), render(180));
writeFileSync(join(PUBLIC, "favicon.png"), render(64));
console.log("✓ icons generated in public/");
