#!/usr/bin/env bash
# One-command launcher for Save a Plate (demo build).
# Usage: ./launch.sh          -> install (if needed), build (if needed), serve on http://localhost:3000
#        PORT=4000 ./launch.sh
set -euo pipefail
cd "$(dirname "$0")"

# Use a Node on PATH, else the one installed under ~/.local
if ! command -v node >/dev/null 2>&1; then
  for d in "$HOME"/.local/node-v22*/bin; do
    [ -x "$d/node" ] && export PATH="$d:$PATH" && break
  done
fi
command -v node >/dev/null 2>&1 || { echo "Node.js not found. Install Node 20+ from https://nodejs.org" >&2; exit 1; }

if [ ! -f .env.local ]; then
  SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
  sed "s|^SESSION_SECRET=.*|SESSION_SECRET=$SECRET|" .env.example > .env.local
  echo "Created .env.local with a fresh SESSION_SECRET"
fi

[ -d node_modules ] || npm ci
[ -d .next ] || npm run build

PORT="${PORT:-3000}"
echo "Save a Plate -> http://localhost:$PORT   (demo sign-in: /signin)"
exec npx next start -p "$PORT"
