#!/usr/bin/env bash
# Compress every case-study GLB in place: Draco geometry (decoder allowed by CSP
# via www.gstatic.com) + WebP textures capped at 2048px. Skips files already
# under the threshold and files that don't get smaller.
set -u
DIR="public/case-study/model"
MIN_BYTES=${MIN_BYTES:-700000}
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

for f in "$DIR"/*.glb; do
  name="$(basename "$f")"
  before=$(stat -c%s "$f")
  if [ "$before" -lt "$MIN_BYTES" ]; then
    echo "SKIP  $name ($(( before / 1024 )) KB)"
    continue
  fi
  out="$TMP/$name"
  if ! node_modules/.bin/gltf-transform optimize "$f" "$out" \
      --compress draco \
      --texture-compress webp \
      --texture-size 2048 \
      --simplify false >"$TMP/$name.log" 2>&1; then
    echo "FAIL  $name — see $TMP/$name.log"; tail -5 "$TMP/$name.log"
    continue
  fi
  after=$(stat -c%s "$out")
  if [ "$after" -ge "$before" ]; then
    echo "KEEP  $name (no gain)"
    continue
  fi
  cp "$out" "$f"
  echo "OK    $name  $(( before / 1024 )) KB -> $(( after / 1024 )) KB"
done
