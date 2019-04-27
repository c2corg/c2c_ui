/* eslint-disable no-console */

const fs = require('fs');
const axios = require('axios');

const repoSlug = process.env.TRAVIS_REPO_SLUG;
const tagName = process.env.TRAVIS_TAG;
const githubUsername = process.env.GITHUB_USERNAME;
const githubToken = process.env.GITHUB_TOKEN;

const gitLog = fs.readFileSync('/dev/stdin', 'utf-8');
console.log(`git log : \n${gitLog}`);

console.log(`getting release data on https://api.github.com/repos/${repoSlug}/releases/tags/${tagName}`);

axios.get(`https://api.github.com/repos/${repoSlug}/releases/tags/${tagName}`)
  .then((response) => {
    const data = response.data;
    const releaseUrl = data.url;

    const payload = {
      'tag_name': data.tag_name,
      'target_commitish': data.target_commitish,
      'name': data.name,
      'body': gitLog,
      'draft': data.draft,
      'prerelease': data.prerelease
    };

    console.log('Update release data');

    axios.patch(releaseUrl, payload, {
      auth: {
        username: githubUsername,
        password: githubToken
      }
    })
      .then(() => {
        console.log('Release is updated');
      })
      .catch(() => {
        console.log('Unexpected error. Ouput has been disabled on purpose for security reasons');
        process.exit(1);
    });
  })
  .catch(() => {
    console.log('Unexpected error. Ouput has been disabled on purpose for security reasons');
    process.exit(1);
  }
);
