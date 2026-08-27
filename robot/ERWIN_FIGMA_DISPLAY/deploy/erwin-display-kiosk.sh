#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${ERWIN_DISPLAY_ROOT:-/home/user/robot-display}"
PORT="${ERWIN_DISPLAY_PORT:-8080}"
URL="http://127.0.0.1:${PORT}"

cd "${APP_ROOT}/dist"
SERVER_PID=""
if ! curl --silent --fail "${URL}" >/dev/null 2>&1; then
  python3 -m http.server "${PORT}" --bind 127.0.0.1 &
  SERVER_PID=$!
  trap 'if [[ -n "${SERVER_PID}" ]]; then kill "${SERVER_PID}" 2>/dev/null || true; fi' EXIT INT TERM

  for _ in {1..20}; do
    if curl --silent --fail "${URL}" >/dev/null 2>&1; then
      break
    fi
    sleep 0.25
  done
fi

case "${ERWIN_DISPLAY_BROWSER:-auto}" in
  auto)
    if command -v chromium-browser >/dev/null 2>&1; then
      BROWSER=chromium-browser
    elif command -v chromium >/dev/null 2>&1; then
      BROWSER=chromium
    elif command -v google-chrome >/dev/null 2>&1; then
      BROWSER=google-chrome
    elif command -v firefox >/dev/null 2>&1; then
      BROWSER=firefox
    else
      echo "No supported kiosk browser found." >&2
      exit 1
    fi
    ;;
  *)
    BROWSER="${ERWIN_DISPLAY_BROWSER}"
    ;;
esac

if [[ "${BROWSER}" == "firefox" ]]; then
  exec "${BROWSER}" --kiosk "${URL}"
else
  exec "${BROWSER}" \
    --kiosk \
    --noerrdialogs \
    --disable-infobars \
    --disable-session-crashed-bubble \
    "${URL}"
fi
