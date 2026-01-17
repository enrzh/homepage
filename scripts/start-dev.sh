#!/bin/sh
set -e

node server.js &

exec npm run dev
