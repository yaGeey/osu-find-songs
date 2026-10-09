#!/usr/bin/env bash
#
# Tests for public/unix.sh. Run on macOS or Linux:
#     bash scripts/tests/unix-sh.Tests.sh
#
# Pure shell - no Pester and no Python required. The JSON payload is checked through the script's
# `--dump` mode (no server); an optional POST round-trip is exercised when python3 is available.

set -u

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
UNIX_SH="$SCRIPT_DIR/../../public/unix.sh"

[ -f "$UNIX_SH" ] || { echo "Cannot find public/unix.sh at $UNIX_SH" >&2; exit 1; }

tmp="${TMPDIR:-/tmp}/osu-find-songs-tests.$$"
rm -rf "$tmp"
mkdir -p "$tmp"
trap 'rm -rf "$tmp"' EXIT

pass=0
fail=0
skip=0

ok()   { pass=$((pass + 1)); printf '  [PASS] %s\n' "$1"; }
bad()  { fail=$((fail + 1)); printf '  [FAIL] %s\n' "$1"; }
skip() { skip=$((skip + 1)); printf '  [SKIP] %s\n' "$1"; }

assert_eq() { # actual expected label
    if [ "$1" = "$2" ]; then ok "$3"; else bad "$3 (expected [$2], got [$1])"; fi
}

count_titles() { grep -o '"Title":' "$1" 2>/dev/null | wc -l | tr -d ' '; }

contains() {
    if grep -qF "$2" "$1" 2>/dev/null; then ok "$3"; else bad "$3 (missing: $2)"; fi
}

not_contains() {
    if grep -qF "$2" "$1" 2>/dev/null; then bad "$3 (unexpected: $2)"; else ok "$3"; fi
}

# --- fixtures --------------------------------------------------------------
# The lazer store lives at the Linux default under a redirected XDG_DATA_HOME, so the script's
# own path detection (no override flag) is what gets exercised.
xdg="$tmp/xdg"
lazer_default="$xdg/osu"
files="$lazer_default/files"
mkdir -p "$files/a/ab" "$files/c/cd" "$files/e/ef"

printf 'osu file format v14\n\n[Metadata]\nTitle:Blue Zenith\nTitleUnicode:ブルーゼニス\nArtist:xi\nArtistUnicode:xi\n\n[Difficulty]\nTitle:Not Real\n' > "$files/a/ab/h1"
printf '\xef\xbb\xbfosu file format v14\n\n[Metadata]\nTitle:Blue Zenith\nTitleUnicode:ブルーゼニス\nArtist:xi\nArtistUnicode:xi\n' > "$files/c/cd/h2"
printf 'osu file format v14\n\n[Metadata]\nTitle:Freedom Dive\nArtist:xi\n' > "$files/e/ef/h3"
head -c 256 /dev/urandom > "$files/e/ef/blob"

songs="$tmp/songs"
mkdir -p "$songs/Set A" "$songs/Set B" "$songs/Empty"
printf 'osu file format v14\n\n[Metadata]\nTitle:Blue Zenith\nArtist:xi\n' > "$songs/Set A/a.osu"
printf 'osu file format v14\n\n[Metadata]\nTitle:Other Song\nArtist:y\n' > "$songs/Set A/z.osu"
printf 'osu file format v14\n\n[Metadata]\nTitle:Freedom Dive\nArtist:xi\n' > "$songs/Set B/map.osu"
printf 'nope\n' > "$songs/Empty/readme.txt"

fakebin="$tmp/fakebin"
mkdir -p "$fakebin"
printf '#!/bin/sh\necho Darwin\n' > "$fakebin/uname"
chmod +x "$fakebin/uname"

# --- 1. lazer: dedupe + JSON payload --------------------------------------
echo "lazer (macOS/Linux)"
lazer_json="$tmp/lazer.json"
lazer_log=$(XDG_DATA_HOME="$xdg" bash "$UNIX_SH" --source lazer --dump "$lazer_json" 2>&1)
assert_eq "$?" "0" "exits 0"
assert_eq "$(count_titles "$lazer_json")" "2" "deduplicates two difficulties of one set"
contains "$lazer_json" '"Title":"Blue Zenith"' "keeps Blue Zenith"
contains "$lazer_json" '"Title":"Freedom Dive"' "keeps Freedom Dive"
contains "$lazer_json" '"ArtistUnicode":"xi"' "reads all four metadata fields"
contains "$lazer_json" '"TitleUnicode":"ブルーゼニス"' "reads beatmaps that start with a UTF-8 BOM"
case "$lazer_log" in *"Wrote 2 maps"*) ok "reports the map count" ;; *) bad "reports the map count (got: $lazer_log)" ;; esac

# --- 1b. lazer honours a moved store (storage.ini) ------------------------
echo "lazer moved store (storage.ini)"
moved="$tmp/moved"
mkdir -p "$moved/files/x/xy"
printf 'osu file format v14\n\n[Metadata]\nTitle:Moved Map\nArtist:z\n' > "$moved/files/x/xy/m1"
printf 'FullPath = %s\n' "$moved" > "$lazer_default/storage.ini"

moved_json="$tmp/moved.json"
moved_log=$(XDG_DATA_HOME="$xdg" bash "$UNIX_SH" --source lazer --dump "$moved_json" 2>&1)
assert_eq "$?" "0" "exits 0"
assert_eq "$(count_titles "$moved_json")" "1" "reads the store pointed to by storage.ini"
contains "$moved_json" '"Title":"Moved Map"' "reads maps from the moved location"
not_contains "$moved_json" 'Blue Zenith' "does not read the default location"

# a FullPath that no longer exists must fall back to the default
printf 'FullPath = %s\n' "$tmp/does-not-exist" > "$lazer_default/storage.ini"
XDG_DATA_HOME="$xdg" bash "$UNIX_SH" --source lazer --dump "$tmp/fallback.json" >/dev/null 2>&1
assert_eq "$(count_titles "$tmp/fallback.json")" "2" "falls back to the default when FullPath is missing"
rm -f "$lazer_default/storage.ini"

# --- 2. Linux rejects osu!stable ------------------------------------------
if [ "$(uname -s)" = "Linux" ]; then
    echo "stable on Linux"
    err=$(bash "$UNIX_SH" --source stable --songs "$songs" --dump "$tmp/nope.json" 2>&1)
    assert_eq "$?" "1" "exits 1"
    case "$err" in *"not supported on Linux"*) ok "explains why" ;; *) bad "explains why (got: $err)" ;; esac
else
    skip "stable rejection (only relevant on Linux)"
fi

# --- 3. faked macOS: stable, first .osu of each set folder ----------------
echo "stable (faked macOS)"
stable_json="$tmp/stable.json"
stable_log=$(PATH="$fakebin:$PATH" bash "$UNIX_SH" --source stable --songs "$songs" --dump "$stable_json" 2>&1)
assert_eq "$?" "0" "exits 0"
assert_eq "$(count_titles "$stable_json")" "2" "emits one map per set folder"
contains "$stable_json" '"Title":"Blue Zenith"' "uses the first .osu file (C order)"
contains "$stable_json" '"Title":"Freedom Dive"' "reads the second set"
not_contains "$stable_json" 'Other Song' "ignores the later .osu of a folder"
not_contains "$stable_json" 'readme' "ignores non-beatmap files"

# --- 4. argument validation -----------------------------------------------
echo "argument validation"
bash "$UNIX_SH" >/dev/null 2>&1
assert_eq "$?" "2" "missing --playlist exits 2"

# --- 5. POST round-trip (optional) ----------------------------------------
if command -v python3 >/dev/null 2>&1; then
    echo "POST round-trip"
    port=38099
    capture="$tmp/capture.json"
    recv="$tmp/recv.py"
    cat > "$recv" <<'PY'
import http.server, sys
out = sys.argv[1]
class H(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        n = int(self.headers.get('content-length', '0'))
        body = self.rfile.read(n)
        open(out, 'wb').write(body)
        sys.stderr.write('RECV %s %s\n' % (self.path, self.headers.get('x-client-id')))
        sys.stderr.flush()
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'{}')
    def log_message(self, *a):
        pass
http.server.HTTPServer(('127.0.0.1', int(sys.argv[2])), H).serve_forever()
PY
    recv_log="$tmp/recv.log"
    python3 "$recv" "$capture" "$port" 2>"$recv_log" &
    recv_pid=$!
    sleep 1

    post_log=$(XDG_DATA_HOME="$xdg" bash "$UNIX_SH" --source lazer \
        --playlist test-pl --client cid-123 --api "http://127.0.0.1:$port" 2>&1)
    assert_eq "$?" "0" "exits 0"
    kill "$recv_pid" 2>/dev/null
    wait "$recv_pid" 2>/dev/null

    if grep -q 'RECV /spotify/playlist/test-pl cid-123' "$recv_log"; then
        ok "posts to the playlist url with the x-client-id header"
    else
        bad "posts to the playlist url with the x-client-id header (log: $(cat "$recv_log" 2>/dev/null))"
    fi
    assert_eq "$(count_titles "$capture")" "2" "posts the deduplicated payload"
else
    skip "POST round-trip (python3 not available)"
fi

# --- summary ---------------------------------------------------------------
echo
echo "Passed: $pass  Failed: $fail  Skipped: $skip"
[ "$fail" -eq 0 ] || exit 1
