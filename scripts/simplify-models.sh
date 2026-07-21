#!/usr/bin/env bash
# These GLBs render into ~110px thumbnail cards in the case-study grid, but
# several carry 100k-450k triangles each. Across 35 products, duplicated x2 for
# the marquee loop, that was 5.3M resident triangles -- enough to freeze the
# renderer outright. Decimate anything above TARGET toward TARGET triangles.
#
# Runs the whole thing through `optimize` rather than the standalone `simplify`
# command: simplify alone drops the Draco extension, which INFLATED files
# (90KB -> 418KB, 897KB -> 26MB) because the geometry came back out raw.
# `optimize` welds, simplifies, then re-applies Draco + WebP in one pass.
set -u
DIR="public/case-study/model"
TARGET=${TARGET:-20000}
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

tris() {
  node -e "
    const fs=require('fs'),b=fs.readFileSync(process.argv[1]);
    const j=JSON.parse(b.slice(20,20+b.readUInt32LE(12)).toString('utf8'));
    let t=0;
    for(const m of (j.meshes||[])) for(const p of (m.primitives||[])){
      const a=j.accessors[p.indices];
      if(a) t+=a.count/3;
      else { const pa=j.accessors[p.attributes&&p.attributes.POSITION]; if(pa) t+=pa.count/3; }
    }
    console.log(Math.round(t));
  " "$1"
}

total_before=0; total_after=0
for f in "$DIR"/*.glb; do
  name="$(basename "$f")"
  before=$(tris "$f")
  total_before=$((total_before + before))
  if [ "$before" -le "$TARGET" ]; then
    echo "SKIP  $name (${before} tris)"
    total_after=$((total_after + before))
    continue
  fi
  ratio=$(node -e "console.log(Math.max(0.01,($TARGET/$before)).toFixed(4))")
  out="$TMP/$name"
  if ! node_modules/.bin/gltf-transform optimize "$f" "$out" \
      --compress draco \
      --texture-compress webp \
      --texture-size 2048 \
      --weld true \
      --simplify true \
      --simplify-ratio "$ratio" \
      --simplify-error 0.01 \
      --simplify-lock-border false >"$TMP/$name.log" 2>&1; then
    echo "FAIL  $name"; tail -4 "$TMP/$name.log"
    total_after=$((total_after + before)); continue
  fi
  after=$(tris "$out")
  bb=$(stat -c%s "$f"); ba=$(stat -c%s "$out")
  # Never accept a result that got bigger on disk -- that means compression was
  # dropped somewhere in the pipeline.
  if [ "$ba" -ge "$bb" ]; then
    echo "KEEP  $name (output grew $((bb/1024))KB -> $((ba/1024))KB, discarded)"
    total_after=$((total_after + before)); continue
  fi
  cp "$out" "$f"
  total_after=$((total_after + after))
  echo "OK    $name  ${before} -> ${after} tris   $((bb/1024))KB -> $((ba/1024))KB"
done
echo "-----"
echo "triangles: ${total_before} -> ${total_after}"
