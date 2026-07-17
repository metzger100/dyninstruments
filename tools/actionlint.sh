#!/usr/bin/env bash
set -euo pipefail

version="1.7.12"
install_mode=false
actionlint_args=()

for arg in "$@"; do
  if [[ "$arg" == "--install" ]]; then
    install_mode=true
  else
    actionlint_args+=("$arg")
  fi
done

case "$(uname -s)" in
  Linux) os="linux" ;;
  Darwin) os="darwin" ;;
  *)
    echo "Unsupported actionlint OS: $(uname -s)" >&2
    exit 1
    ;;
esac

case "$(uname -m)" in
  x86_64 | amd64) arch="amd64" ;;
  arm64 | aarch64) arch="arm64" ;;
  *)
    echo "Unsupported actionlint architecture: $(uname -m)" >&2
    exit 1
    ;;
esac

case "${os}_${arch}" in
  linux_amd64) sha256="8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8" ;;
  linux_arm64) sha256="325e971b6ba9bfa504672e29be93c24981eeb1c07576d730e9f7c8805afff0c6" ;;
  darwin_amd64) sha256="5b44c3bc2255115c9b69e30efc0fecdf498fdb63c5d58e17084fd5f16324c644" ;;
  darwin_arm64) sha256="aba9ced2dee8d27fecca3dc7feb1a7f9a52caefa1eb46f3271ea66b6e0e6953f" ;;
esac

cache_base="${ACTIONLINT_CACHE_DIR:-${XDG_CACHE_HOME:-$HOME/.cache}/dyninstruments/actionlint}"
cache_root="${cache_base}/v${version}"
target_dir="${cache_root}/${os}_${arch}"
binary="${target_dir}/actionlint"
archive="${target_dir}/actionlint.tar.gz"
verified_marker="${target_dir}/.verified"
url="https://github.com/rhysd/actionlint/releases/download/v${version}/actionlint_${version}_${os}_${arch}.tar.gz"

verify_archive() {
  if command -v sha256sum >/dev/null 2>&1; then
    printf '%s  %s\n' "$sha256" "$archive" | sha256sum -c -
  else
    actual="$(shasum -a 256 "$archive" | awk '{print $1}')"
    test "$actual" = "$sha256"
  fi
}

provision() {
  mkdir -p "$target_dir"
  curl -fsSL "$url" -o "$archive"
  verify_archive
  tar -xzf "$archive" -C "$target_dir" actionlint
  chmod +x "$binary"
  touch "$verified_marker"
}

if [[ "$install_mode" == true ]]; then
  if [[ ! -x "$binary" || ! -f "$verified_marker" ]]; then
    provision
  fi
elif [[ ! -x "$binary" || ! -f "$verified_marker" ]]; then
  echo "actionlint is not provisioned in the cache. Run 'npm run setup' first." >&2
  exit 1
fi

exec "$binary" "${actionlint_args[@]}"
