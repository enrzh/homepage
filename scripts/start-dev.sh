#!/bin/sh
node server.js &
SERVER_PID=$!

npm run dev &
VITE_PID=$!

trap 'kill "$SERVER_PID" "$VITE_PID"' INT TERM EXIT

while true; do
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "server.js exited."
    exit 1
  fi
  if ! kill -0 "$VITE_PID" 2>/dev/null; then
    echo "vite exited."
    exit 1
  fi
  sleep 1
done
