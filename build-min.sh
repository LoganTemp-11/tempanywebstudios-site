#!/bin/sh
# Regenerates the minified engine files the pages actually load.
# Edit scrollcraft.js / scrollcraft.css (the readable source), run this, then
# bump the ?v= query on the <script> and <link> tags so caches let go.
# tw-consent.js keeps its config block (everything down to the "engine" line)
# exactly as it is; only the engine under it is rebuilt from tw-consent.src.js.
# It is revalidated on every visit (_headers), so it needs no ?v= bump.
set -e
cd "$(dirname "$0")"
npx -y esbuild scrollcraft.js  --minify --log-level=warning --outfile=scrollcraft.min.js
npx -y esbuild scrollcraft.css --minify --log-level=warning --outfile=scrollcraft.min.css
sed '/^\/\* ===== engine ===== \*\/$/q' tw-consent.js > tw-consent.js.tmp
grep -q '^/\* ===== engine ===== \*/$' tw-consent.js.tmp
npx -y esbuild tw-consent.src.js --minify --log-level=warning >> tw-consent.js.tmp
mv tw-consent.js.tmp tw-consent.js
ls -l scrollcraft.min.js scrollcraft.min.css tw-consent.js
