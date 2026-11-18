import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// Work on the distributed copies, retaining the original textured source assets.
const directory = process.argv[2] ?? 'dist/case-study/model';
for (const file of await readdir(directory)) {
  if (!file.endsWith('.glb')) continue;
  const path = join(directory, file);
  const bytes = await readFile(path);
  const jsonEnd = 20 + bytes.readUInt32LE(12);
  const model = JSON.parse(bytes.subarray(20, jsonEnd).toString());
  const textile = /nonwoven|woven-thread/.test(file);

  for (const material of model.materials ?? []) {
    if (/studio dark|hinge pin|mark material|handwriting|hand-marks|bumper/i.test(material.name ?? '')) continue;
    const surface = material.pbrMetallicRoughness ??= {};
    const extensions = material.extensions ??= {};
    surface.metallicFactor = 0;
    surface.roughnessFactor = Math.min(surface.roughnessFactor ?? 1, textile ? 0.52 : 0.23);
    const coat = extensions.KHR_materials_clearcoat ??= {};
    coat.clearcoatFactor = textile ? 0.24 : 0.72;
    coat.clearcoatRoughnessFactor = textile ? 0.28 : 0.12;
    model.extensionsUsed = [...new Set([...(model.extensionsUsed ?? []), 'KHR_materials_clearcoat'])];
  }

  const json = Buffer.from(JSON.stringify(model));
  const padded = Buffer.alloc(Math.ceil(json.length / 4) * 4, 0x20);
  json.copy(padded);
  const header = Buffer.from(bytes.subarray(0, 20));
  const binary = bytes.subarray(jsonEnd);
  header.writeUInt32LE(header.length + padded.length + binary.length, 8);
  header.writeUInt32LE(padded.length, 12);
  await writeFile(path, Buffer.concat([header, padded, binary]));
}
