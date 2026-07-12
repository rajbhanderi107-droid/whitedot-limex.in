import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

// GLTFExporter is browser-oriented, but the generated scene has no textures;
// this minimal Blob reader is enough to run it deterministically in Node.
if (!globalThis.FileReader) {
  globalThis.FileReader = class {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buffer) => {
        this.result = buffer;
        this.onloadend?.();
      });
    }
  };
}

const output = resolve('public/case-study/model/round-pipe-procedural.glb');
const height = 0.105;
const outerRadius = 0.055;
const innerRadius = 0.047;
const ribCount = 22;
const ribAmplitude = 0.0042;
const profile = [];

// Closed wall profile: inner bottom -> outer bottom -> corrugated outside -> inner top.
profile.push(new THREE.Vector2(innerRadius, -height / 2));
profile.push(new THREE.Vector2(outerRadius, -height / 2));
for (let i = 0; i <= ribCount * 4; i += 1) {
  const t = i / (ribCount * 4);
  const y = -height / 2 + t * height;
  const phase = (i % 4) / 4;
  const radius = phase === 0 || phase === 3
    ? outerRadius
    : outerRadius + ribAmplitude * (phase === 1 ? 0.72 : 1);
  profile.push(new THREE.Vector2(radius, y));
}
profile.push(new THREE.Vector2(outerRadius, height / 2));
profile.push(new THREE.Vector2(innerRadius, height / 2));

const geometry = new THREE.LatheGeometry(profile, 128);
geometry.computeVertexNormals();
const material = new THREE.MeshStandardMaterial({
  color: new THREE.Color(0x45464b),
  roughness: 0.34,
  metalness: 0.04,
});
const pipe = new THREE.Mesh(geometry, material);
pipe.name = 'Round_Pipe_Corrugated';
pipe.rotation.x = Math.PI / 2;

const scene = new THREE.Scene();
scene.add(pipe);
scene.updateMatrixWorld(true);

const exporter = new GLTFExporter();
const result = await exporter.parseAsync(scene, { binary: true, onlyVisible: true });
await mkdir(dirname(output), { recursive: true });
await writeFile(output, Buffer.from(result));
console.log(`Wrote ${output} (${result.byteLength} bytes)`);
