<template>
  <div class="section content">
    <html-header :title="$gettext('Differences between versions')" />
    <masked-document-version-info
      v-if="containsMaskedVersion"
      :document-type="documentType"
    ></masked-document-version-info>
    <template v-else>
      <h1>
        <icon-document :document-type="documentType" class="is-large" />
        <span>&#8239;</span>
        <span>diff</span> ({{ lang }}) :
        <router-link :to="{ name: documentType, params: { id: documentId, lang: lang } }">{{ title }}</router-link>
      </h1>
      <div class="columns">
        <div v-if="oldVersion" class="column">
          <div>
            <version-link
              :document-type="documentType"
              :id="documentId"
              :version="oldVersion.version.version_id"
              :lang="lang"
            >
              Revision #{{ oldVersion.document.version }} as of
              {{ $dateUtils.toTechnicalString(oldVersion.version.written_at) }}
            </version-link>
          </div>
          <div>by <contributor-link :contributor="oldVersion.version" /></div>
          <div>
            {{ oldVersion.version.comment }}
          </div>
          <div>
            <diff-link
              v-if="oldVersion.previous_version_id"
              :document-type="documentType"
              :id="documentId"
              :lang="lang"
              :version-from="oldVersion.previous_version_id"
              :version-to="oldVersion.version.version_id"
            >
              ←
              <span v-translate>previous difference</span>
            </diff-link>
            <span v-else v-translate>This is the first version</span>
          </div>
        </div>

        <div v-if="newVersion" class="column">
          <div>
            <version-link
              :document-type="documentType"
              :id="documentId"
              :version="newVersion.version.version_id"
              :lang="lang"
            >
              Revision #{{ newVersion.document.version }} as of
              {{ $dateUtils.toTechnicalString(newVersion.version.written_at) }}
            </version-link>
          </div>
          <div>by <contributor-link :contributor="newVersion.version" /></div>
          <div>
            {{ newVersion.version.comment }}
          </div>
          <div>
            <diff-link
              v-if="newVersion.next_version_id"
              :document-type="documentType"
              :id="documentId"
              :lang="lang"
              :version-from="newVersion.version.version_id"
              :version-to="newVersion.next_version_id"
            >
              <span v-translate>next difference</span>
              →
            </diff-link>
            <span v-else v-translate>This is the last version</span>
          </div>
        </div>
      </div>

      <div v-if="oldVersion && newVersion">
        <div v-if="filenameHasChanged">
          <div class="columns">
            <div class="column">
              <thumbnail :img="oldVersion.document" size="MI" class="is-pulled-right" />
            </div>
            <div class="column">
              <thumbnail :img="newVersion.document" size="MI" />
            </div>
          </div>
        </div>

        <div v-if="geometryHasChanged" class="map-container">
          <map-view :old-document="oldVersion.document" :new-document="newVersion.document" />
        </div>

        <div v-for="key of Object.keys(diffProperties)" :key="key">
          <h2 class="title is-2 has-text-centered">{{ $gettext(key) | uppercaseFirstLetter }}</h2>
          <div class="columns">
            <div class="column is-6">
              <del v-if="diffProperties[key].old === null" class="is-pulled-right is-italic">null</del>
              <del v-else class="is-pulled-right">{{ diffProperties[key].old }}</del>
            </div>
            <div class="column is-6">
              <ins v-if="diffProperties[key].new === null" class="is-italic">null</ins>
              <ins v-else>{{ diffProperties[key].new }}</ins>
            </div>
          </div>
        </div>

        <div v-for="(diffLocale, key) of diffLocales" :key="key">
          <h2 class="title is-2 has-text-centered">{{ $gettext(key) }}</h2>

          <div class="columns is-mobile">
            <div class="column is-6">
              <div class="splitted-diff">
                <div v-for="(block, blockKey) of diffLocale" :key="blockKey">
                  <div
                    v-if="block.ellipsed"
                    class="block-ellipsed has-text-centered is-size-7 has-text-grey-light is-italic"
                  >
                    {{ block.rows.length }} identical rows
                  </div>
                  <div v-else>
                    <div
                      v-for="(row, rowKey) of block.rows"
                      :key="rowKey"
                      class="row-diff"
                      :class="{ 'row-del': !row.isIdentical && !row.isFakeOld, 'row-fake': row.isFakeOld }"
                    >
                      <component
                        v-for="(item, itemKey) of row.oldPart"
                        :key="itemKey"
                        :is="item.isIdentical ? 'span' : 'del'"
                        >{{ item.text }}</component
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="column is-6">
              <div class="splitted-diff">
                <div v-for="(block, blockKey) of diffLocale" :key="blockKey">
                  <div
                    v-if="block.ellipsed"
                    class="block-ellipsed has-text-centered is-size-7 has-text-grey-light is-italic"
                  >
                    {{ block.rows.length }} identical rows
                  </div>
                  <div v-else>
                    <div
                      v-for="(row, rowKey) of block.rows"
                      :key="rowKey"
                      class="row-diff"
                      :class="{ 'row-ins': !row.isIdentical && !row.isFakeNew, 'row-fake': row.isFakeNew }"
                    >
                      <component
                        v-for="(item, itemKey) of row.newPart"
                        :key="itemKey"
                        :is="item.isIdentical ? 'span' : 'ins'"
                        >{{ item.text }}</component
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import MaskedDocumentVersionInfo from './utils/MaskedDocumentVersionInfo';
import { diffMatchPatch } from './utils/diff_match_patch_uncompressed';

import c2c from '@/js/apis/c2c';
import constants from '@/js/constants';
import noRobotsMixin from '@/js/no-robots-mixin';

const hasChanged = function (oldVal, newVal) {
  // does oldVal equals to newVal ?
  // handle arrays and immutables values
  // and considerer that null equal to null, and nothing else

  if (Array.isArray(oldVal) || Array.isArray(newVal)) {
    return JSON.stringify(oldVal) !== JSON.stringify(newVal);
  }

  if ((oldVal === null && newVal !== null) || (oldVal !== null && newVal === null)) {
    return true;
  }

  return oldVal !== newVal;
};

const computeDiff = function (diff, callback) {
  // this function transform a diff from diffMatchPatch
  //
  // it calls sequentially callback with three argument :
  //
  // * old part of diff
  // * new part of diff
  // * isIdentical (obvioulsy when old === new)
  //
  // if isIdentical is false, there are three use cases :
  //
  // * both part are not null : it means that a replacement has been made
  // * old part is null : it's an addition
  // * new part is null : it's a deletion
  //
  // Note about diff structure : it's an array of (mode, text) where mode can be :
  //
  // * -1 : means a deletion
  // * 0  : means that text has not been modified
  // * 1  : means an addition
  //
  // this structure has a particularity : deletion, if it exists, always precedes addition. So, the logic is :
  //
  // * if mode === 0 : callback(text, text, true)
  // * else if mode === 1 : next mode will be 0, so call callback(null, text, false)
  // * else if mode === -1 (last possibility) :
  //   * if next mode is 0, it means that an addition can't be linked to this deletion : callback(text, null, false)
  //   * else, next diff item can be linked to this deletion : callback(text, nextText, false)

  for (let i = 0; i < diff.length; i++) {
    if (diff[i][0] === 0) {
      // no modification, old part and new part are equals
      callback(diff[i][1], diff[i][1], true);
    } else if (diff[i][0] === 1) {
      // an addition, and there is no suppression
      callback(null, diff[i][1], false);
    } else if (diff[i][0] === -1) {
      if (i + 1 < diff.length && diff[i + 1][0] === 1) {
        // an added part follows this removed part
        callback(diff[i][1], diff[i + 1][1], false);
        i += 1;
      } else {
        // there is not added part that can be linked to this removed part
        callback(diff[i][1], null, false);
      }
    }
  }
};

const Item = function (text, isIdentical) {
  // an Item is a small amount of text, with a flag that tell if this text has been modified, or not
  this.text = text;
  this.isIdentical = isIdentical;
};

const Row = function (oldPart, newPart, isIdentical) {
  // a row is a object with old and new part
  // each part is an array of items
  // isIdentical is obvious
  // ellipsed is a UI flag : if true, w'ont be displayed.
  //   it will be computed by Row.computeEllipsisStates()

  this.oldPart = [];
  this.newPart = [];

  this.ellipsed = true;
  this.isIdentical = isIdentical;

  if (isIdentical) {
    this.oldPart = [new Item(oldPart, true)];
    this.newPart = this.oldPart; // same object (reduce memory footprint)
  } else if (oldPart === undefined) {
    this.newPart.push(new Item(newPart, false));
  } else if (newPart === undefined) {
    this.oldPart.push(new Item(oldPart, false));
  } else {
    // two different row on the same location, let's compute a precise diff
    const diff = diffMatchPatch.diff_main(oldPart, newPart);
    computeDiff(diff, this.addItem.bind(this));
  }
};

Object.defineProperty(Row.prototype, 'isFakeOld', {
  // boolean, true if old part does not exists
  get() {
    return this.oldPart.length === 0;
  },
});

Object.defineProperty(Row.prototype, 'isFakeNew', {
  // boolean, true if new part does not exists
  get() {
    return this.newPart.length === 0;
  },
});

Row.prototype.addItem = function (oldPart, newPart, isIdentical) {
  // this function is a callback for computeDiff
  // oldPart and newPart are a small amount of text
  if (isIdentical) {
    const item = new Item(oldPart, true);
    this.oldPart.push(item);
    this.newPart.push(item);
  } else {
    if (oldPart !== undefined) {
      this.oldPart.push(new Item(oldPart, false));
    }

    if (newPart !== undefined) {
      this.newPart.push(new Item(newPart, false));
    }
  }
};

const Rows = function () {
  // simple array of Row() objects, with computation methods
  this.items = [];
};

Rows.prototype.build = function (oldText, newText) {
  // compute a line diff
  const linesData = diffMatchPatch.diff_linesToChars_(oldText, newText);
  const diff = diffMatchPatch.diff_main(linesData.chars1, linesData.chars2, false);
  diffMatchPatch.diff_charsToLines_(diff, linesData.lineArray);

  computeDiff(diff, this.add.bind(this));
};

Rows.prototype.add = function (oldPart, newPart, isIdentical) {
  // callback for computDiff()
  // oldPart and newPart are text containing EOLs and finishing with a last EOL
  // it performs a split on this text, and add equivalent rows
  // note that if oldPart is different from newPart, and if there is not the same
  // quantity of EOL, Row object can be initialized with one of oldPart/newPart
  // argument equals to undefined
  const rows = this.items;

  if (isIdentical) {
    const rowTexts = oldPart.split('\n');
    for (const rowText of rowTexts.slice(0, rowTexts.length - 1)) {
      rows.push(new Row(rowText, rowText, true));
    }
  } else {
    oldPart = oldPart !== null ? oldPart.split('\n') : [];
    newPart = newPart !== null ? newPart.split('\n') : [];
    for (let i = 0; i < Math.max(oldPart.length - 1, newPart.length - 1); i++) {
      rows.push(new Row(oldPart[i], newPart[i], false));
    }
  }
};

Rows.prototype.computeEllipsisStates = function () {
  // set Row.ellipsed to false on all rows where Row.isIdentical === false
  // and also on 2 surrouding rows
  // the idea is to display context rows on top and bottom of a modified row
  const rows = this.items;
  for (let i = 0; i < rows.length; i++) {
    if (!rows[i].isIdentical) {
      for (let j = Math.max(0, i - 2); j <= Math.min(rows.length - 1, i + 2); j++) {
        rows[j].ellipsed = false;
      }
    }
  }
};

export default {
  components: {
    MaskedDocumentVersionInfo,
  },

  mixins: [noRobotsMixin],

  data() {
    return {
      title: null,
      oldVersion: null,
      newVersion: null,
      diffProperties: {},
      diffLocales: {},
      containsMaskedVersion: true,
    };
  },

  computed: {
    documentId() {
      return parseInt(this.$route.params.id);
    },

    documentType() {
      return this.$route.name.replace('-diff', '');
    },

    lang() {
      return this.$route.params.lang;
    },

    geoLocalized() {
      return constants.objectDefinitions[this.documentType].geoLocalized;
    },

    filenameHasChanged() {
      return this.oldVersion.document.filename !== this.newVersion?.document?.filename;
    },

    geometryHasChanged() {
      // areas are flagged as not geolocalized because you cant display
      // ol map componenent on /areas
      // but it contains geometry
      if (!this.geoLocalized && this.documentType !== 'area') {
        return false;
      }

      if (!this.$documentUtils.hasSameGeolocation(this.oldVersion.document, this.newVersion?.document)) {
        return true;
      }
      const oldGeometry = this.oldVersion?.document?.geometry;
      const newGeometry = this.newVersion?.document?.geometry;

      if (oldGeometry.geom_detail !== newGeometry.geom_detail) {
        return true;
      }

      return false;
    },
  },

  watch: {
    $route: {
      handler: 'loadVersions',
      immediate: true,
    },
  },

  methods: {
    loadVersions() {
      this.loadVersion(this.$route.params.versionFrom, 'oldVersion');
      this.loadVersion(this.$route.params.versionTo, 'newVersion');
    },

    getKeys(obj1, obj2, excludedKeys = []) {
      let keys = Object.keys(obj1).concat(Object.keys(obj2));

      keys = keys.filter(function (item, pos, self) {
        return self.indexOf(item) === pos && !excludedKeys.includes(item);
      });

      keys.sort();
      return keys;
    },

    buildDiff() {
      this.diffProperties = {};
      this.diffLocales = {};

      if (!this.oldVersion || !this.newVersion) {
        return; // Waiting for other version
      }

      if (this.oldVersion.document && this.newVersion.document) {
        this.containsMaskedVersion = false;
      } else {
        return;
      }

      const keys = this.getKeys(this.oldVersion.document, this.newVersion.document, [
        'version',
        'locales',
        'geometry',
        'cooked',
        'filename',
      ]);

      for (const key of keys) {
        if (hasChanged(this.oldVersion.document[key], this.newVersion.document[key])) {
          this.diffProperties[key] = {
            old: this.oldVersion.document[key],
            new: this.newVersion.document[key],
          };
        }
      }

      const oldLocale = this.$documentUtils.getLocaleStupid(this.oldVersion.document, this.lang);
      const newLocale = this.$documentUtils.getLocaleStupid(this.newVersion.document, this.lang);
      const localeKeys = this.getKeys(oldLocale, newLocale, ['lang', 'version']);

      const prepareText = function (text) {
        text = text ?? ''; // text can be null
        text = text.replace(/\r\n?/g, '\n');
        text += text.endsWith('\n') ? '' : '\n';

        return text;
      };

      for (const key of localeKeys) {
        const oldVal = prepareText(oldLocale[key]);
        const newVal = prepareText(newLocale[key]);

        if (hasChanged(oldVal, newVal)) {
          const rows = new Rows();
          rows.build(oldVal, newVal);
          rows.computeEllipsisStates();

          const Block = function (ellipsed) {
            this.rows = [];
            this.ellipsed = ellipsed;
          };

          const blocks = [new Block(rows.items[0].ellipsed)];

          let currentBlock = blocks[0];

          for (const row of rows.items) {
            if (currentBlock.ellipsed !== row.ellipsed) {
              currentBlock = new Block(row.ellipsed);
              blocks.push(currentBlock);
            }
            currentBlock.rows.push(row);
          }

          this.diffLocales[key] = blocks;
        }
      }
    },

    loadVersion(versionId, resultProperty) {
      this[resultProperty] = null;

      if (versionId === 'prev' || versionId === 'next') {
        return;
      }

      c2c[this.documentType].getVersion(this.documentId, this.lang, versionId).then((response) => {
        this[resultProperty] = response.data;

        // handle when url version is prev or next
        // the other version contains the good id
        if (this.$route.params.versionFrom === 'prev' && resultProperty === 'newVersion') {
          this.loadVersion(this.newVersion.previous_version_id, 'oldVersion');
        }

        if (this.$route.params.versionTo === 'next' && resultProperty === 'oldVersion') {
          this.loadVersion(this.newVersion.next_version_id, 'newVersion');
        }

        if (resultProperty === 'newVersion' && this.newVersion.document) {
          this.title = this.$documentUtils.getLocaleStupid(this.newVersion.document, this.lang).title;
        }

        this.buildDiff();
      });
    },
  },
};
</script>

<style scoped lang="scss">
.locale-diff pre {
  white-space: pre-line;
  line-height: 1.3;
}

.splitted-diff {
  overflow: hidden;
  overflow-x: scroll;
  background: #eaeaea;

  .block-ellipsed {
    background: white;
    user-select: none;
  }

  .row-diff {
    font-family: monospace;
    font-size: 14px;
    white-space: pre;
    line-height: 1.3;
    padding: 0 0.5rem;
    height: 18px;
    border-left: 5px solid lightgrey;
  }

  .row-del {
    background: #ffeeee !important;
    border-left-color: red;
  }

  .row-ins {
    background: #eefff4 !important;
    border-left-color: green;
  }

  .row-fake {
    background: #f2f2f2 !important;
    border-left-color: #eee;
  }

  .row-ellipsed {
    color: red;
    display: None;
  }
}

ins {
  background: lightgreen !important;
  text-decoration: none;
}

del {
  background: pink !important;
  text-decoration: none;
}

h2 {
  margin-top: 2rem;
  margin-bottom: 0.5rem !important;
}

.map-container {
  height: 400px;
}
</style>
