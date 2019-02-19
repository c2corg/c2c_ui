Data for i18n

## How to ?

### 1. Extract all messages

run task `messages:extract` in vue UI, or

```bash
npm run messages:extract
```

Do not forget to do this each time you modify a message, and include it in your commit

### 2. Send this message list to transifex

With python and transifex-client installed

```bash
tx push -s
```

### 3. Get translated messages from transifex

Run messages:compile in vue UI, or :

```bash
npm run messages:compile
```

Do not forget to commit this !

## Todo

Actually, everything is manual. Target in semi-automatic, with only on last look when integrating translations in build

* [ ] Step 1 must be an automatic task in webpack
* [ ] Step 2 must be in CI, when a PR in merged on master
* [x] step 3 must be in one single script, without duplicated data in .po
* [ ] Step 3 must be an automatic PR

At target, when someone modify a messages :

1. pot file is automaticly updated
2. when the PR is merged, this pot file is sent to transifex
3. when the message is translated, an new branch is created, with the .json updated, and a PR ready-to-merge is created
4. last, and only manual step : the merge of this PR after a last look by a devlopper

With this workflow, we have :

* Data sent to transifex are tracked by .pot file
* Data included in builds are tracked by .json files
