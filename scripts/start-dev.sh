#!/bin/sh
set -e

node server.js &
SERVER_PID=$!

sleep 1
if ! kill -0 "$SERVER_PID" 2>/dev/null; then
  echo "server.js failed to start."
  exit 1
fi

trap 'kill "$SERVER_PID"' INT TERM EXIT

exec npm run dev
