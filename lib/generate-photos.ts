import { deflateSync } from "node:zlib";
import type { DatabaseSync } from "node:sqlite";

// ---- Encodeur PNG minimal (RGB 8 bits, sans dépendance externe) ----

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array): Buffer {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, Buffer.from(data)])), 0);
  return Buffer.concat([len, typeBuf, Buffer.from(data), crc]);
}

function encodePNG(width: number, height: number, rgb: Uint8Array): Buffer {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filtre "None"
    for (let x = 0; x < stride; x++) {
      raw[y * (stride + 1) + 1 + x] = rgb[y * stride + x];
    }
  }

  const idat = deflateSync(raw);
  return Buffer.concat([
    sig,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", new Uint8Array(0)),
  ]);
}

// ---- Dessin d'une illustration de mil ----

type RGB = [number, number, number];

const W = 400;
const H = 300;

const PANICLE_COLORS: RGB[] = [
  [217, 164, 65],
  [201, 138, 43],
  [224, 176, 80],
  [184, 131, 47],
  [212, 160, 78],
  [230, 192, 102],
];
const STEM: RGB = [74, 124, 63];
const LEAF: RGB = [90, 140, 74];
const BG_TOP: RGB = [251, 243, 221];
const BG_BOTTOM: RGB = [239, 227, 194];

function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function setPx(img: Uint8Array, x: number, y: number, c: RGB) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  img[i] = c[0];
  img[i + 1] = c[1];
  img[i + 2] = c[2];
}

function fillGradient(img: Uint8Array) {
  for (let y = 0; y < H; y++) {
    const t = y / H;
    const r = Math.round(BG_TOP[0] + (BG_BOTTOM[0] - BG_TOP[0]) * t);
    const g = Math.round(BG_TOP[1] + (BG_BOTTOM[1] - BG_TOP[1]) * t);
    const b = Math.round(BG_TOP[2] + (BG_BOTTOM[2] - BG_TOP[2]) * t);
    for (let x = 0; x < W; x++) {
      setPx(img, x, y, [r, g, b]);
    }
  }
}

function fillEllipse(img: Uint8Array, cx: number, cy: number, rx: number, ry: number, c: RGB) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) setPx(img, x, y, c);
    }
  }
}

function fillRect(img: Uint8Array, x0: number, y0: number, w: number, h: number, c: RGB) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      setPx(img, x, y, c);
    }
  }
}

function drawThickLine(img: Uint8Array, x0: number, y0: number, x1: number, y1: number, thickness: number, c: RGB) {
  const minX = Math.max(0, Math.floor(Math.min(x0, x1) - thickness));
  const maxX = Math.min(W - 1, Math.ceil(Math.max(x0, x1) + thickness));
  const minY = Math.max(0, Math.floor(Math.min(y0, y1) - thickness));
  const maxY = Math.min(H - 1, Math.ceil(Math.max(y0, y1) + thickness));
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len2 = dx * dx + dy * dy;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      let dist: number;
      if (len2 === 0) {
        dist = Math.hypot(x - x0, y - y0);
      } else {
        const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / len2));
        dist = Math.hypot(x - (x0 + t * dx), y - (y0 + t * dy));
      }
      if (dist <= thickness) setPx(img, x, y, c);
    }
  }
}

function drawPanicle(img: Uint8Array, cx: number, cy: number, color: RGB) {
  // épi (cylindre allongé)
  fillEllipse(img, cx, cy, 40, 95, color);
  // texture de graines : stries verticales plus foncées
  const darker: RGB = [Math.max(0, color[0] - 35), Math.max(0, color[1] - 30), Math.max(0, color[2] - 25)];
  for (let i = -2; i <= 2; i++) {
    const sx = cx + i * 12;
    fillEllipse(img, sx, cy, 3, 80, darker);
  }
}

function drawVarietyIllustration(seed: number): Buffer {
  const img = new Uint8Array(W * H * 3);
  fillGradient(img);

  const panicleColor = PANICLE_COLORS[seed % PANICLE_COLORS.length];

  // feuilles
  drawThickLine(img, 175, 250, 130, 200, 5, LEAF);
  drawThickLine(img, 225, 250, 270, 200, 5, LEAF);

  // tige
  drawThickLine(img, 200, 240, 200, 130, 6, STEM);

  // épi
  drawPanicle(img, 200, 95, panicleColor);

  return encodePNG(W, H, img);
}

// ---- Insertion en base ----

export function generateVarietyPhotos(db: DatabaseSync): void {
  const varieties = db.prepare("SELECT id, nom_officiel, caracteristiques_grain FROM varieties ORDER BY id").all() as {
    id: number;
    nom_officiel: string;
    caracteristiques_grain: string;
  }[];

  const insert = db.prepare(
    "INSERT INTO variety_photos (variety_id, data, mime_type, legende, source, is_cover) VALUES (?, ?, 'image/png', ?, 'illustration générée', 1)"
  );

  let added = 0;
  for (const v of varieties) {
    const count = db.prepare("SELECT COUNT(*) AS c FROM variety_photos WHERE variety_id = ?").get(v.id) as { c: number };
    if (count.c > 0) continue;
    const png = drawVarietyIllustration(v.id);
    insert.run(v.id, png, `Illustration de ${v.nom_officiel} (mil à chandelle)`);
    added++;
  }

  console.log(`Photos d'illustration générées : ${added} ajoutée(s) (sur ${varieties.length} variétés).`);
}
