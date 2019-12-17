#!/bin/sh -e

# This script will deploy current branch on github pages. The idea is to
# provide a working site for each branch available on github. So, anybody
# can test&check modification proposed in PR. Notice that, for security
# reason, it won't be run for PR run from a forked repo.

# clone repository on gh-pages branch. Save it in gh-pages folder
git clone --single-branch --branch=gh-pages https://${GITHUB_TOKEN}@github.com/${TRAVIS_REPO_SLUG}.git gh-pages

export CLEANED_TRAVIS_BRANCH=${TRAVIS_BRANCH/\//-}
# move build into gh-pages folder, under a new folder with <branch-name> as name
rm -rf gh-pages/$CLEANED_TRAVIS_BRANCH
mv dist gh-pages/$CLEANED_TRAVIS_BRANCH

# Add this folder into gh-pages branch, commit and push
cd gh-pages
git add .
git commit -m "Deploy $CLEANED_TRAVIS_BRANCH branch"
git push > /dev/null 2>&1
