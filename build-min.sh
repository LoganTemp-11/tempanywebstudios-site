#!/bin/sh
# Regenerates the minified engine files the pages actually load.
# Edit scrollcraft.js / scrollcraft.css (the readable source), run this, then
# bump the ?v= query on the <script> and <link> tags so caches let go.
set -e
cd "$(dirname "$0")"
npx -y esbuild scrollcraft.js  --minify --log-level=warning --outfile=scrollcraft.min.js
npx -y esbuild scrollcraft.css --minify --log-level=warning --outfile=scrollcraft.min.css
ls -l scrollcraft.min.js scrollcraft.min.css
