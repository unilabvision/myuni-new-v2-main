#!/bin/zsh

set -euo pipefail

cd "${0:A:h}/.."
umask 077

echo "Supabase migration connection setup"
echo "The connection strings stay on this computer and are not printed."
echo

read -r -s "identity_url?DB1 / Identity Session Pooler URI: "
echo
read -r -s "learning_url?DB2 / Learning Session Pooler URI: "
echo
read -r -s "forms_url?DB3 / Forms Session Pooler URI: "
echo

validate_url() {
  local label="$1"
  local expected_ref="$2"
  local value="$3"

  if [[ "$value" != postgresql://* && "$value" != postgres://* ]]; then
    echo "ERROR: $label must start with postgresql:// or postgres://" >&2
    return 1
  fi

  if [[ "$value" != *"postgres.${expected_ref}"* ]]; then
    echo "ERROR: $label does not contain expected project user postgres.${expected_ref}" >&2
    return 1
  fi

  if [[ "$value" != *"pooler.supabase.com"* ]]; then
    echo "ERROR: $label is not a Supabase pooler URI" >&2
    return 1
  fi
}

validate_url "DB1 / Identity" "qdhecdfowszvcllqnnui" "$identity_url"
validate_url "DB2 / Learning" "petqvkaqfjluaklyyrdo" "$learning_url"
validate_url "DB3 / Forms" "ncbmscykhckoehasnayq" "$forms_url"

connections_file=".env.migration.local"
{
  printf 'SUPABASE_IDENTITY_DATABASE_URL=%s\n' "$identity_url"
  printf 'SUPABASE_LEARNING_DATABASE_URL=%s\n' "$learning_url"
  printf 'SUPABASE_FORMS_DATABASE_URL=%s\n' "$forms_url"
} > "$connections_file"
chmod 600 "$connections_file"

echo
echo "Saved locally to $connections_file (permissions: 600, Git-ignored)."
echo "Running read-only connection tests..."
echo

check_connection() {
  local label="$1"
  local url="$2"
  local expected_ref="$3"
  local result

  result=$(psql "$url" -X -v ON_ERROR_STOP=1 -Atc \
    "select current_database() || ' | ' || current_user || ' | server=' || current_setting('server_version');")
  echo "OK  $label ($expected_ref): $result"
}

check_connection "DB1 / Identity" "$identity_url" "qdhecdfowszvcllqnnui"
check_connection "DB2 / Learning" "$learning_url" "petqvkaqfjluaklyyrdo"
check_connection "DB3 / Forms" "$forms_url" "ncbmscykhckoehasnayq"

unset identity_url learning_url forms_url

echo
echo "All three read-only connection tests passed."
echo "Return to Codex and write: baglantilar hazir"
echo
read -r "?Press Enter to close this setup window..."
