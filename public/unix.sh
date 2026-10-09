#!/usr/bin/env bash
#
# osu-find-songs helper for macOS and Linux - the shell counterpart of win.ps1.
#
# It scans an osu! install, reads the Title / TitleUnicode / Artist / ArtistUnicode metadata of
# every beatmap and POSTs the result to the local API. No download and no PowerShell needed:
#
#   curl -fsSL '<APP_URL>/unix.sh' | bash -s -- --playlist '<PLID>' --client '<CID>' --api '<LOCAL_API_URL>' --app '<APP_URL>'
#
# Supported data sources:
#   osu!(lazer)  - macOS and Linux. Files live under the SHA-256 addressed store
#                  (files/<x>/<xx>/<hash>); raw `.osu` files are found by content and
#                  deduplicated by metadata.
#   osu!stable   - macOS only (Wine bottle `Songs`). osu!stable on Linux is NOT supported.
#
# Optional flags:
#   --source stable|lazer   skip the version prompt
#   --songs PATH            skip the folder prompt (stable only)
#   --dump FILE             write the JSON payload to FILE and skip sending (preview/testing)
#
# The osu!(lazer) data folder is detected automatically (including a store moved with the in-game
# "Change folder location..." option, recorded in storage.ini).
#
# Written to work with bash 3.2 (macOS), zsh and plain sh, and only uses standard tools
# (find, grep, awk, sort, curl).

set -u

playlist=""
client=""
api=""
app=""
wanted_source=""
wanted_songs=""
dump=""

usage() {
    cat <<'EOF'
Usage: unix.sh --playlist <id> --client <id> --api <url> [--app <url>]
               [--source stable|lazer] [--songs <path>] [--dump <file>]
EOF
}

while [ $# -gt 0 ]; do
    case "$1" in
        --playlist) playlist="${2:-}"; shift 2 ;;
        --client)   client="${2:-}";   shift 2 ;;
        --api)      api="${2:-}";      shift 2 ;;
        --app)      app="${2:-}";      shift 2 ;;
        --source)   wanted_source="${2:-}"; shift 2 ;;
        --songs)    wanted_songs="${2:-}";  shift 2 ;;
        --dump)     dump="${2:-}";    shift 2 ;;
        -h|--help)  usage; exit 0 ;;
        *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
    esac
done

if [ -z "$dump" ]; then
    [ -n "$playlist" ] || { echo '--playlist is required.' >&2; exit 2; }
    [ -n "$client" ]   || { echo '--client is required.' >&2;   exit 2; }
    [ -n "$api" ]      || { echo '--api is required.' >&2;      exit 2; }
fi

command -v curl >/dev/null 2>&1 || { echo "curl is required but was not found." >&2; exit 1; }

# --- per-OS defaults -------------------------------------------------------
os_kind="other"
case "$(uname -s 2>/dev/null)" in
    Darwin) os_kind="mac" ;;
    Linux)  os_kind="linux" ;;
    *)      os_kind="other" ;;
esac

if [ "$os_kind" = "mac" ]; then
    default_lazer_root="$HOME/Library/Application Support/osu"
    stable_default="/Applications/osu!.app/Contents/Resources/drive_c/osu!/Songs"
elif [ "$os_kind" = "linux" ]; then
    if [ -n "${XDG_DATA_HOME:-}" ]; then
        default_lazer_root="$XDG_DATA_HOME/osu"
    else
        default_lazer_root="$HOME/.local/share/osu"
    fi
    stable_default=""
else
    echo "Unsupported OS: $(uname -s 2>/dev/null). This script is for macOS/Linux; on Windows use win.ps1." >&2
    exit 1
fi

# osu!(lazer) lets the user move the whole file store; the chosen path is kept in storage.ini
# inside the default folder (a plain `FullPath = <path>` line). Prefer it when present.
lazer_root="$default_lazer_root"
storage_ini="$default_lazer_root/storage.ini"
if [ -f "$storage_ini" ]; then
    custom_lazer_root=$(sed -n 's/^[[:space:]]*FullPath[[:space:]]*=[[:space:]]*//p' "$storage_ini" | head -n 1 | sed -e 's/[[:space:]]*$//')
    if [ -n "$custom_lazer_root" ] && [ -d "$custom_lazer_root" ]; then
        lazer_root="$custom_lazer_root"
    fi
fi

# Reads a line from the controlling terminal. Needed because `curl | bash` occupies stdin with
# the script itself, so a plain `read` would consume the script, not user input.
read_tty() {
    answer=""
    if [ -r /dev/tty ]; then
        IFS= read -r answer < /dev/tty || answer=""
    fi
    printf '%s' "$answer"
}

# --- choose the data source ------------------------------------------------
if [ -n "$wanted_source" ]; then
    source="$wanted_source"
elif [ "$os_kind" = "linux" ]; then
    echo "osu!stable is not supported on Linux - scanning osu!(lazer)."
    source="lazer"
else
    has_stable=0
    [ -n "$stable_default" ] && [ -e "$stable_default" ] && has_stable=1
    has_lazer=0
    [ -e "$lazer_root/client.realm" ] && has_lazer=1

    default="stable"
    default_label="S"
    if [ "$has_lazer" = 1 ] && [ "$has_stable" = 0 ]; then
        default="lazer"
        default_label="L"
    fi

    while :; do
        printf 'Which osu! version? [S]table / [L]azer (Enter = %s): ' "$default_label"
        answer=$(read_tty | tr '[:upper:]' '[:lower:]')
        case "$answer" in
            "") source="$default"; break ;;
            s|stable|1) source="stable"; break ;;
            l|lazer|2)  source="lazer"; break ;;
            *) echo 'Please type S for stable or L for lazer.' ;;
        esac
    done
fi

case "$source" in
    stable)
        if [ "$os_kind" = "linux" ]; then
            echo "osu!stable is not supported on Linux." >&2
            exit 1
        fi
        ;;
    lazer) ;;
    *) echo "Unknown source: $source (expected stable or lazer)." >&2; exit 2 ;;
esac

# --- collect the .osu files to parse ---------------------------------------
tmpbase="${TMPDIR:-/tmp}/osu-find-songs.$$"
list="$tmpbase.list"
jsonfile="$tmpbase.json"
: > "$list"
: > "$jsonfile"
trap 'rm -f "$list" "$jsonfile"' EXIT

dedupe=1

if [ "$source" = "lazer" ]; then
    files_root="$lazer_root/files"
    if [ ! -d "$files_root" ] && [ "$(basename "$lazer_root")" = "files" ]; then
        files_root="$lazer_root"
    fi
    if [ ! -d "$files_root" ]; then
        echo "osu!(lazer) 'files' folder not found at: $files_root" >&2
        exit 1
    fi
    echo "Scanning osu!(lazer) storage: $lazer_root"
    grep -rlI -- 'osu file format' "$files_root" 2>/dev/null > "$list" || true
else
    songs="$wanted_songs"
    if [ -z "$songs" ]; then
        printf '\nSelect osu folder (Enter for default: %s): ' "$stable_default"
        songs=$(read_tty)
    fi
    # strip surrounding whitespace and quotes
    songs=$(printf '%s' "$songs" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
    songs=${songs%\"}; songs=${songs#\"}
    if [ -z "$songs" ]; then songs="$stable_default"; fi
    if [ ! -d "$songs" ]; then
        echo "Folder not found: $songs - falling back to the current directory."
        songs=$(pwd)
    fi

    # one beatmap set per folder: take the first .osu (C order) of each subfolder
    for dir in "$songs"/*/; do
        [ -d "$dir" ] || continue
        first=$(printf '%s\n' "$dir"*.osu 2>/dev/null | LC_ALL=C sort | head -n 1)
        if [ -n "$first" ] && [ -f "$first" ]; then
            printf '%s\n' "$first" >> "$list"
        fi
    done
    dedupe=0
fi

total=$(wc -l < "$list" | tr -d ' ')

# --- parse .osu files and build the JSON payload ---------------------------
# Each path is fed on stdin; for every file the [Metadata] section is read (and nothing after
# it). Output JSON goes to $jsonfile; the number of emitted maps is printed to stdout.
count=$(awk -v total="$total" -v dedupe="$dedupe" -v out="$jsonfile" '
function trim(s) { sub(/^[ \t\r]+/, "", s); sub(/[ \t\r]+$/, "", s); return s }
function jstr(s) {
    if (s == "") return "null"
    gsub(/\\/, "\\\\", s)
    gsub(/"/, "\\\"", s)
    gsub(/\t/, "\\t", s)
    return "\"" s "\""
}
BEGIN { printf "[" > out; nout = 0; lastfilled = -1; i = 0 }
{
    file = $0
    i++
    if (total > 0) {
        filled = int(i * 24 / total)
        if (filled != lastfilled) {
            lastfilled = filled
            bar = ""
            for (k = 1; k <= 24; k++) bar = bar (k <= filled ? "#" : "-")
            printf "\r[%s] %d/%d Parsing maps...", bar, i, total > "/dev/stderr"
        }
    }

    inmeta = 0; got = 0
    t = ""; tu = ""; ar = ""; aru = ""
    while ((getline line < file) > 0) {
        sub(/\r$/, "", line)
        if (line ~ /^\[/) {
            if (inmeta) break
            if (line ~ /^\[Metadata\]/) { inmeta = 1; got = 1 }
            continue
        }
        if (inmeta) {
            if (line ~ /^Title:/)             t   = trim(substr(line, 7))
            else if (line ~ /^TitleUnicode:/) tu  = trim(substr(line, 14))
            else if (line ~ /^Artist:/)       ar  = trim(substr(line, 8))
            else if (line ~ /^ArtistUnicode:/) aru = trim(substr(line, 15))
        }
    }
    close(file)

    if (!got) next
    if (dedupe) {
        key = ar "|" t "|" aru "|" tu
        if (key in seen) next
        seen[key] = 1
    }

    if (nout == 0) printf "{" > out; else printf ",{" > out
    printf "\"Title\":%s,\"TitleUnicode\":%s,\"Artist\":%s,\"ArtistUnicode\":%s}", jstr(t), jstr(tu), jstr(ar), jstr(aru) > out
    nout++
}
END {
    printf "]" > out
    if (total > 0) printf "\r%70s\r", "" > "/dev/stderr"
    printf "%d\n", nout
}
' "$list")

if [ "$count" -eq 0 ]; then
    echo "No beatmaps found."
    exit 0
fi

if [ -n "$dump" ]; then
    cp "$jsonfile" "$dump"
    echo "Wrote $count maps to $dump"
    exit 0
fi

# --- send everything to the local API --------------------------------------
bar="########################"
printf '\r[%s] %s/%s Sending maps to server...\n' "$bar" "$count" "$count"

api=${api%/}
url="$api/spotify/playlist/$playlist"

http_code=$(curl -sS -o /dev/null -w '%{http_code}' \
    -X POST "$url" \
    -H "x-client-id: $client" \
    -H 'Content-Type: application/json; charset=utf-8' \
    --data-binary @"$jsonfile" \
    --max-time 120)
curl_status=$?

if [ "$curl_status" -ne 0 ]; then
    echo "Failed to send maps: could not reach $url" >&2
    exit 1
fi

case "$http_code" in
    2*)
        echo "Done! $count maps parsed."
        if [ -n "$app" ]; then
            echo "Return back to the app to see progress - ${app%/}/from-osu"
        fi
        ;;
    *)
        echo "Failed to send maps: server returned HTTP $http_code" >&2
        exit 1
        ;;
esac
