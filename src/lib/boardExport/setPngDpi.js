const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = makeCrcTable();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint32BE(view, offset, value) {
  view.setUint32(offset, value, false);
}

function createPhysChunk(dpi) {
  const pixelsPerMeter = Math.round(dpi / 0.0254);
  const type = new TextEncoder().encode("pHYs");
  const data = new Uint8Array(9);
  const dataView = new DataView(data.buffer);
  dataView.setUint32(0, pixelsPerMeter, false);
  dataView.setUint32(4, pixelsPerMeter, false);
  data[8] = 1;

  const chunk = new Uint8Array(4 + 4 + data.length + 4);
  const view = new DataView(chunk.buffer);
  writeUint32BE(view, 0, data.length);
  chunk.set(type, 4);
  chunk.set(data, 8);
  writeUint32BE(view, 8 + data.length, crc32(chunk.subarray(4, 8 + data.length)));
  return chunk;
}

function signaturesMatch(bytes) {
  return (
    bytes.length >= PNG_SIGNATURE.length &&
    PNG_SIGNATURE.every((byte, i) => bytes[i] === byte)
  );
}

/**
 * Insert a pHYs chunk after IHDR so viewers treat the PNG as at least `dpi`.
 */
export async function setPngDpi(blob, dpi = 72) {
  const input = new Uint8Array(await blob.arrayBuffer());
  if (!signaturesMatch(input)) {
    return blob;
  }

  const ihdrEnd = 8 + 4 + 4 + 13 + 4;
  if (input.length < ihdrEnd) {
    return blob;
  }

  const phys = createPhysChunk(dpi);
  const output = new Uint8Array(input.length + phys.length);
  output.set(input.subarray(0, ihdrEnd), 0);
  output.set(phys, ihdrEnd);
  output.set(input.subarray(ihdrEnd), ihdrEnd + phys.length);
  return new Blob([output], { type: "image/png" });
}
