import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const outputDirectory = fileURLToPath(new URL("../public/icons/", import.meta.url));
const sizes = [16, 32, 48, 128];
const scale = 4;

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data = Buffer.alloc(0)) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function encodePng(width, height, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;

  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y += 1) {
    const target = y * (width * 4 + 1);
    scanlines[target] = 0;
    pixels.copy(scanlines, target + 1, y * width * 4, (y + 1) * width * 4);
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(scanlines, { level: 9 })),
    chunk("IEND"),
  ]);
}

function insideRoundedRect(x, y, width, height, radius) {
  const cx = Math.max(radius, Math.min(width - radius, x));
  const cy = Math.max(radius, Math.min(height - radius, y));
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}

function insidePolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function blend(base, overlay) {
  const alpha = overlay[3] / 255;
  return [
    Math.round(base[0] * (1 - alpha) + overlay[0] * alpha),
    Math.round(base[1] * (1 - alpha) + overlay[1] * alpha),
    Math.round(base[2] * (1 - alpha) + overlay[2] * alpha),
    255,
  ];
}

function sample(nx, ny) {
  const artworkInset = 12.5;
  const artworkSize = 75;
  if (!insideRoundedRect(nx - artworkInset, ny - artworkInset, artworkSize, artworkSize, 16.5)) return [0, 0, 0, 0];
  nx = ((nx - artworkInset) / artworkSize) * 100;
  ny = ((ny - artworkInset) / artworkSize) * 100;

  const gradient = ny / 100;
  let color = [Math.round(24 - gradient * 9), Math.round(27 - gradient * 10), Math.round(36 - gradient * 15), 255];
  const glowDistance = Math.hypot(nx - 72, ny - 18);
  if (glowDistance < 58) color = blend(color, [108, 92, 231, Math.round((1 - glowDistance / 58) * 105)]);

  const shield = [[50, 18], [76, 29], [73, 58], [66, 73], [50, 84], [34, 73], [27, 58], [24, 29]];
  if (insidePolygon(nx, ny, shield)) {
    const shieldGradient = Math.max(0, Math.min(1, (ny - 18) / 66));
    color = [Math.round(139 - shieldGradient * 38), Math.round(124 - shieldGradient * 45), Math.round(246 - shieldGradient * 15), 255];
  }

  const keyholeCircle = Math.hypot(nx - 50, ny - 46) <= 8;
  const keyholeStem = nx >= 46.5 && nx <= 53.5 && ny >= 48 && ny <= 64;
  if (keyholeCircle || keyholeStem) color = [248, 249, 252, 255];

  return color;
}

function renderIcon(size) {
  const highSize = size * scale;
  const highPixels = Array.from({ length: highSize * highSize }, (_, index) => {
    const x = index % highSize;
    const y = Math.floor(index / highSize);
    return sample(((x + 0.5) / highSize) * 100, ((y + 0.5) / highSize) * 100);
  });
  const pixels = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const total = [0, 0, 0, 0];
      for (let sy = 0; sy < scale; sy += 1) {
        for (let sx = 0; sx < scale; sx += 1) {
          const pixel = highPixels[(y * scale + sy) * highSize + x * scale + sx];
          pixel.forEach((channel, index) => { total[index] += channel; });
        }
      }
      const offset = (y * size + x) * 4;
      total.forEach((channel, index) => { pixels[offset + index] = Math.round(channel / (scale * scale)); });
    }
  }

  return encodePng(size, size, pixels);
}

mkdirSync(outputDirectory, { recursive: true });
for (const size of sizes) writeFileSync(`${outputDirectory}/icon${size}.png`, renderIcon(size));
