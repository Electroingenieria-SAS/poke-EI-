import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const specs = [
  { file: 'src/runtime/playerIdle.ts', constant: 'PLAYER_IDLE', width: 160, height: 192, frameW: 32, frameH: 48 },
  { file: 'src/runtime/playerWalk.ts', constant: 'PLAYER_WALK', width: 160, height: 192, frameW: 32, frameH: 48 },
  { file: 'src/runtime/playerSlash.ts', constant: 'PLAYER_SLASH', width: 240, height: 192, frameW: 48, frameH: 48 },
];

function extractBase64(file, constant) {
  const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const re = new RegExp(`export\\s+const\\s+${constant}\\s*=\\s*['\"]([^'\"]+)['\"]`);
  const match = text.match(re);
  if (!match) throw new Error(`${file}: no se encontró ${constant}`);
  return match[1];
}

function readPngInfo(buffer) {
  const signature = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
  if (!buffer.subarray(0, 8).equals(signature)) throw new Error('firma PNG inválida');
  if (buffer.toString('ascii', 12, 16) !== 'IHDR') throw new Error('IHDR ausente');
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const colorType = buffer[25];
  const hasTRNS = buffer.includes(Buffer.from('tRNS'));
  const hasAlpha = colorType === 4 || colorType === 6 || (colorType === 3 && hasTRNS);
  return { width, height, colorType, hasAlpha };
}

let failures = 0;
for (const spec of specs) {
  try {
    const b64 = extractBase64(spec.file, spec.constant);
    const buffer = Buffer.from(b64, 'base64');
    const info = readPngInfo(buffer);
    if (info.width !== spec.width || info.height !== spec.height) throw new Error(`dimensión ${info.width}x${info.height}, esperada ${spec.width}x${spec.height}`);
    if (info.width % spec.frameW !== 0 || info.height % spec.frameH !== 0) throw new Error('la hoja no divide exactamente en frames');
    if (!info.hasAlpha) throw new Error(`PNG sin alpha utilizable (colorType=${info.colorType})`);
    console.log(`✓ ${spec.file}: ${info.width}x${info.height}, alpha OK, frames ${spec.frameW}x${spec.frameH}`);
  } catch (error) {
    failures += 1;
    console.error(`✗ ${spec.file}: ${error.message}`);
  }
}

if (failures) process.exit(1);
console.log('Runtime asset preflight: OK');
