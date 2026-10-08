const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function createPng(width, height) {
  // Create a minimal valid PNG with purple/dark gradient
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      // Center distance
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = width / 2;

      if (dist < maxDist * 0.4) {
        // Center violet glow
        rawData[pixelOffset] = 139;     // R
        rawData[pixelOffset + 1] = 92;  // G
        rawData[pixelOffset + 2] = 246; // B
        rawData[pixelOffset + 3] = 255; // A
      } else if (dist < maxDist * 0.85) {
        // Dark purple body
        rawData[pixelOffset] = 24;      // R
        rawData[pixelOffset + 1] = 24;  // G
        rawData[pixelOffset + 2] = 27;  // B
        rawData[pixelOffset + 3] = 255; // A
      } else {
        // Background dark
        rawData[pixelOffset] = 9;       // R
        rawData[pixelOffset + 1] = 9;   // G
        rawData[pixelOffset + 2] = 11;  // B
        rawData[pixelOffset + 3] = 255; // A
      }
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = createChunk('IDAT', deflated);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  const toCrc = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(toCrc);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, toCrc, crcBuf]);
}

const dir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

fs.writeFileSync(path.join(dir, 'icon-192x192.png'), createPng(192, 192));
fs.writeFileSync(path.join(dir, 'icon-512x512.png'), createPng(512, 512));
console.log('✅ Icons generated successfully!');
