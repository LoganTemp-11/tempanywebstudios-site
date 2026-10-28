#!/bin/sh
# Regenerates the minified engine files the pages actually load.
# Edit scrollcraft.js / scrollcraft.css (the readable source), run this, then
# bump the ?v= query on the <script> and <link> tags so caches let go.
# tw-consent.js keeps its config block (everything down to the "===== engine" line)
# exactly as it is; only the engine under it is rebuilt from tw-consent.src.js.
# It is revalidated on every visit (_headers), so it needs no ?v= bump.
#
# esbuild is pinned (0.24.0) so two builds on two days give the same bytes, and
# the target is es2016 so the ES5-style sources are not lifted to newer syntax
# an old WebView cannot parse (a parse error in tw-consent.js means no slip and
# no analytics on that device).
#
#   sh build-min.sh          rebuild the three files in place
#   sh build-min.sh --check  build to temp files, compare with the committed
#                            ones, exit 1 naming the first that drifted
#
# The first --check after the pin (28 Oct 2026) was expected to fail once,
# because the committed files had been built with an unpinned esbuild; that
# rebuild is committed in the same change. From then on, drift is a defect.
set -e
cd "$(dirname "$0")"
ESBUILD="npx -y esbuild@0.24.0"
FLAGS="--minify --log-level=warning --target=es2016"

build() {
  # $1 scrollcraft.min.js  $2 scrollcraft.min.css  $3 tw-consent.js
  $ESBUILD scrollcraft.js  $FLAGS --outfile="$1"
  $ESBUILD scrollcraft.css $FLAGS --outfile="$2"
  sed '/^\/\* ===== engine/q' tw-consent.js > "$3"
  grep -q '^/\* ===== engine' "$3"
  $ESBUILD tw-consent.src.js $FLAGS >> "$3"
}

if [ "$1" = "--check" ]; then
  T=$(mktemp -d)
  trap 'rm -rf "$T"' EXIT
  build "$T/scrollcraft.min.js" "$T/scrollcraft.min.css" "$T/tw-consent.js"
  for f in scrollcraft.min.js scrollcraft.min.css tw-consent.js; do
    if ! cmp -s "$T/$f" "$f"; then
      echo "build-min.sh --check: $f differs from a fresh build; run sh build-min.sh and commit" >&2
      exit 1
    fi
  done
  echo "build-min.sh --check: scrollcraft.min.js scrollcraft.min.css tw-consent.js match a fresh build"
  exit 0
fi

build scrollcraft.min.js.tmp scrollcraft.min.css.tmp tw-consent.js.tmp
mv scrollcraft.min.js.tmp scrollcraft.min.js
mv scrollcraft.min.css.tmp scrollcraft.min.css
mv tw-consent.js.tmp tw-consent.js
ls -l scrollcraft.min.js scrollcraft.min.css tw-consent.js
