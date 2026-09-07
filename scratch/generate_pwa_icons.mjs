// scratch/generate_pwa_icons.mjs
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  return table;
}

const crcTable = createCrcTable();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function writeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const toCrc = buf.subarray(4, 8 + len);
  const crc = crc32(toCrc);
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function generatePng(size) {
  const width = size;
  const height = size;
  const bytesPerPixel = 4;
  const scanlineLength = 1 + width * bytesPerPixel;
  const rawData = Buffer.alloc(scanlineLength * height);

  // Background: Brand Blue #2563EB (R: 37, G: 99, B: 235, A: 255)
  // Rounded squircle icon with white document in center
  const radius = size * 0.22;
  const center = size / 2;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter byte: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * bytesPerPixel;

      // Squircle bounding box
      const dx = Math.max(0, Math.abs(x - center) - (center - radius));
      const dy = Math.max(0, Math.abs(y - center) - (center - radius));
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > radius) {
        // Transparent outside squircle
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
        continue;
      }

      // Inside icon background (Blue gradient)
      let r = 37;
      let g = 99;
      let b = 235;

      // Draw white page in center
      const pageLeft = size * 0.28;
      const pageRight = size * 0.72;
      const pageTop = size * 0.22;
      const pageBottom = size * 0.78;

      if (x >= pageLeft && x <= pageRight && y >= pageTop && y <= pageBottom) {
        // White document sheet
        r = 255;
        g = 255;
        b = 255;

        // Folded corner on top right
        const foldSize = size * 0.14;
        if (x > pageRight - foldSize && y < pageTop + foldSize) {
          if ((x - (pageRight - foldSize)) + (y - pageTop) > foldSize) {
            // Fold flap: subtle gray/blue accent
            r = 219;
            g = 234;
            b = 254;
          }
        }

        // Reflow text lines inside document
        const lineLeft = size * 0.35;
        const lineRight = size * 0.65;
        const line1Y = size * 0.45;
        const line2Y = size * 0.55;
        const line3Y = size * 0.65;
        const lineH = Math.max(2, size * 0.03);

        if (x >= lineLeft && x <= lineRight && (
          (y >= line1Y && y <= line1Y + lineH) ||
          (y >= line2Y && y <= line2Y + lineH) ||
          (y >= line3Y && y <= line3Y + lineH * 0.7)
        )) {
          r = 37;
          g = 99;
          b = 235;
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // Color type: RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const idatData = zlib.deflateSync(rawData);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  return Buffer.concat([
    signature,
    writeChunk('IHDR', ihdr),
    writeChunk('IDAT', idatData),
    writeChunk('IEND', Buffer.alloc(0))
  ]);
}

const iconsDir = path.resolve('public/icons');
fs.mkdirSync(iconsDir, { recursive: true });

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), generatePng(192));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), generatePng(512));
console.log('Successfully generated icon-192.png and icon-512.png');
