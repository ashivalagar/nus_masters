#!/usr/bin/env bash
# Start Masters Mind on macOS / Linux.
#   ./start.sh            build if needed, then serve on $PORT (default 8080)
#   ./start.sh --local    no password, this machine only
#   ./start.sh --tunnel   also start ngrok (uses NGROK_DOMAIN from .env if set)
set -euo pipefail
cd "$(dirname "$0")"

command -v node >/dev/null || { echo "Node.js is not installed. Install Node 22 LTS or newer (https://nodejs.org)."; exit 1; }
major=$(node -p 'process.versions.node.split(".")[0]')
[ "$major" -ge 22 ] || { echo "Node $(node -v) is too old; install Node 22 or newer."; exit 1; }

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example. Set MASTERS_PASSWORD in .env, then run ./start.sh again."
  exit 1
fi
set -a; . ./.env; set +a

[ -d node_modules ] || npm install --no-audit --no-fund

extra=()
for a in "$@"; do
  case "$a" in
    --local) extra+=(--insecure-local) ;;
    --tunnel)
      if command -v ngrok >/dev/null; then
        ngrok http "${PORT:-8080}" ${NGROK_DOMAIN:+--url="$NGROK_DOMAIN"} --log=stdout > ngrok.log 2>&1 &
        echo "ngrok started (log: ngrok.log)"
      else echo "ngrok not found; starting without a tunnel"; fi ;;
  esac
done
exec node scripts/start.mjs "${extra[@]+"${extra[@]}"}"
