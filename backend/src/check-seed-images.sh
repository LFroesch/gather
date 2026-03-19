#!/bin/bash
# Check if seed data image URLs are still valid
# Usage: ./check-seed-images.sh

SEED_FILE="$(dirname "$0")/seed.js"
FAILED=0

echo "Checking seed image URLs..."
echo ""

grep -oP "https?://[^\s'\"]*" "$SEED_FILE" | sort -u | while read -r url; do
  status=$(curl -o /dev/null -s -w "%{http_code}" -L --max-time 10 "$url")
  if [ "$status" != "200" ]; then
    echo "BROKEN ($status): $url"
    FAILED=1
  else
    echo "  OK: $url"
  fi
done

echo ""
if [ "$FAILED" = "0" ]; then
  echo "All image URLs are valid."
else
  echo "Some URLs need replacing!"
fi
