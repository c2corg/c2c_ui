#!/bin/sh -e

# if it's a tag, add commit logs
if [ $TRAVIS_TAG ]; then
    firstTag=$(git tag | sort -V -r | head -1)
    secondTag=$(git tag | sort -V -r | head -2 | awk '{split($0, tags, "\n")} END {print tags[1]}')
    git log  --pretty=oneline ${secondTag}..${firstTag} --no-merges | node scripts/update-release-description.js
fi
