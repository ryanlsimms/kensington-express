#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" != "major" && "${1:-}" != "minor" && "${1:-}" != "patch" && "${1:-}" != "premajor" && "${1:-}" != "preminor" && "${1:-}" != "prepatch" && "${1:-}" != "prerelease" ]]; then
  echo "Usage: scripts/release.sh <major|minor|patch|premajor|preminor|prepatch|prerelease>"
  exit 1
fi

PREID="${2:-beta}"
IS_PRERELEASE=false
if [[ "$1" == pre* ]]; then
  IS_PRERELEASE=true
fi

if ! command -v gh &>/dev/null; then
  echo "Error: gh (GitHub CLI) is not installed — run: brew install gh"
  exit 1
fi

if ! gh auth status &>/dev/null; then
  echo "Error: gh is not authenticated — run: gh auth login"
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: uncommitted changes present — commit or stash them before releasing"
  git status --short
  exit 1
fi

TOKEN_UPDATED=$(gh secret list --json name,updatedAt --jq '.[] | select(.name == "NPM_TOKEN") | .updatedAt' 2>/dev/null || true)
if [[ -n "$TOKEN_UPDATED" ]]; then
  TOKEN_EPOCH=$(date -jf "%Y-%m-%dT%H:%M:%SZ" "$TOKEN_UPDATED" +%s 2>/dev/null)
  if [[ -n "$TOKEN_EPOCH" ]]; then
    DAYS_OLD=$(( ($(date +%s) - TOKEN_EPOCH) / 86400 ))
    if [[ $DAYS_OLD -ge 80 ]]; then
      echo "Warning: the GitHub NPM_TOKEN secret was last updated ${DAYS_OLD} days ago — verify the token's expiration in npm before releasing"
    fi
  fi
fi

if [[ "$IS_PRERELEASE" == true ]]; then
  npm version "$1" --preid="$PREID" --no-git-tag-version
else
  npm version "$1" --no-git-tag-version
fi

VERSION=$(node -p "require('./package.json').version")
DATE=$(date +%Y-%m-%d)

sed -i '' "s/^## \[Unreleased\]/## [$VERSION] - $DATE/" CHANGELOG.md

git add package.json package-lock.json CHANGELOG.md
git commit -m "release $VERSION"
git tag -a "v$VERSION" -m "release $VERSION"

git push origin --follow-tags

NOTES=$(awk "/^## \[$VERSION\]/{found=1; next} found && /^## \[/{exit} found{print}" CHANGELOG.md)
if [[ "$IS_PRERELEASE" == true ]]; then
  gh release create "v$VERSION" --title "v$VERSION" --notes "$NOTES" --prerelease
else
  gh release create "v$VERSION" --title "v$VERSION" --notes "$NOTES"
fi
