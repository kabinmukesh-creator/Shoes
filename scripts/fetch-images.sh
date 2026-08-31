#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Mirror the site's photography locally.
#
# By default the page pulls its photos from the Unsplash CDN at runtime. Run
# this once (on a machine with open network access) and the site becomes fully
# self-contained — useful for offline demos, slow venues, or hosting somewhere
# that shouldn't hot-link a third party.
#
#   ./scripts/fetch-images.sh          # download + switch the site to local
#   ./scripts/fetch-images.sh --check  # just report which URLs are reachable
#
# It reads every Unsplash photo id out of index.html and js/app.js, so it stays
# correct when you add or swap products.
# ---------------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")/.."

WIDTH=1600
QUALITY=80
OUT=assets/img
CHECK_ONLY=false
[[ "${1:-}" == "--check" ]] && CHECK_ONLY=true

mkdir -p "$OUT"

ids=$(grep -ohE 'photo-[0-9]{10,13}-[a-z0-9]{12}' index.html \
      | sed 's/^photo-//' ; \
      grep -ohE "(img|spare):'[0-9]{10,13}-[a-z0-9]{12}'" js/app.js \
      | sed "s/^[a-z]*:'//; s/'//" ; \
      grep -ohE 'data-spare="[0-9]{10,13}-[a-z0-9]{12}"' index.html \
      | sed 's/data-spare="//; s/"//')
ids=$(printf '%s\n' $ids | sort -u)

total=0; ok=0; bad=()
for id in $ids; do
  total=$((total+1))
  url="https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${WIDTH}&q=${QUALITY}"
  if $CHECK_ONLY; then
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$url" || echo 000)
    if [[ "$code" == "200" ]]; then ok=$((ok+1)); printf '  ok   %s\n' "$id"
    else bad+=("$id"); printf '  DEAD %s  (HTTP %s)\n' "$id" "$code"; fi
    continue
  fi
  if [[ -s "$OUT/$id.jpg" ]]; then ok=$((ok+1)); printf '  have %s\n' "$id"; continue; fi
  if curl -sfL --max-time 60 -o "$OUT/$id.jpg" "$url"; then
    ok=$((ok+1)); printf '  got  %s  (%s)\n' "$id" "$(du -h "$OUT/$id.jpg" | cut -f1)"
  else
    rm -f "$OUT/$id.jpg"; bad+=("$id"); printf '  FAIL %s\n' "$id"
  fi
done

echo
echo "$ok/$total photographs available."
if ((${#bad[@]})); then
  echo "Replace these ids in index.html / js/app.js with live Unsplash photos:"
  printf '  - %s\n' "${bad[@]}"
fi

$CHECK_ONLY && exit 0
((ok == 0)) && { echo "Nothing downloaded — leaving the site on the CDN."; exit 1; }

# Point the page at the local copies.
python3 - <<'PY'
import re, pathlib
html = pathlib.Path('index.html')
s = html.read_text()
s = re.sub(r'https://images\.unsplash\.com/photo-([0-9]{10,13}-[a-z0-9]{12})\?[^"\s]*',
           r'assets/img/\1.jpg', s)
s = re.sub(r'\n\s*srcset="[^"]*assets/img[^"]*"', '', s)
if 'data-local-photos' not in s:
    s = s.replace('<html lang="en">', '<html lang="en" data-local-photos>', 1)
html.write_text(s)
print('index.html now points at assets/img/ — commit the folder to keep it that way.')
PY
