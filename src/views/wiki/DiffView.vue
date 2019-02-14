<template>
  <div class="section content">
    <html-header :title="$gettext('Differences between versions')"/>
    <h1>
      <icon-document :document-type="documentType" class="is-large"/>
      <span>diff</span> ({{ lang }}) :
      <router-link :to="{ name: documentType, params: {id:documentId, lang:lang} }">{{ title }}</router-link>
    </h1>
    <div class="columns">
      <div v-if="oldVersion" class="column">
        <div>
          <version-link
            :document-type="documentType"
            :id="documentId"
            :version="oldVersion.version.version_id"
            :lang="lang">
            Revision #{{ oldVersion.document.version }} as of {{ $moment.toTechnicalString(oldVersion.version.written_at) }}
          </version-link>
        </div>
        <div>
          by <contributor-link :contributor="oldVersion.version"/>
        </div>
        <div>
          {{ oldVersion.version.comment }}
        </div>
        <div>
          <diff-link v-if="oldVersion.previous_version_id"
                     :document-type="documentType"
                     :id="documentId"
                     :lang="lang"
                     :version-from="oldVersion.previous_version_id"
                     :version-to="oldVersion.version.version_id">
            ←
            <span v-translate>previous difference</span>
          </diff-link>
          <span v-else v-translate>
            This is the first version
          </span>
        </div>
      </div>

      <div v-if="newVersion" class="column">
        <div>
          <version-link
            :document-type="documentType"
            :id="documentId"
            :version="newVersion.version.version_id"
            :lang="lang">
            Revision #{{ newVersion.document.version }} as of {{ $moment.toTechnicalString(newVersion.version.written_at) }}
          </version-link>
        </div>
        <div>
          by <contributor-link :contributor="newVersion.version"/>
        </div>
        <div>
          {{ newVersion.version.comment }}
        </div>
        <div>
          <diff-link v-if="newVersion.next_version_id"
                     :document-type="documentType"
                     :id="documentId"
                     :lang="lang"
                     :version-from="newVersion.version.version_id"
                     :version-to="newVersion.next_version_id">
            <span v-translate>next difference</span>
            →
          </diff-link>
          <span v-else v-translate>
            This is the last version
          </span>
        </div>
      </div>
    </div>

    <div v-if="oldVersion && newVersion">
      <div v-if="geometryHasChanged">
        <map-view :old-document="oldVersion.document" :new-document="newVersion.document" />
      </div>

      <div v-for="key of Object.keys(diffProperties)" :key="key">
        <h2 class="title is-2 has-text-centered">{{ $gettext(key) }}</h2>
        <div class="columns">
          <div class="column is-6">
            <del class="is-pulled-right">{{ diffProperties[key].old }}</del>
          </div>
          <div class="column is-6">
            <ins>{{ diffProperties[key].new }}</ins>
          </div>
        </div>
      </div>

      <div v-for="key of Object.keys(diffLocales)" :key="key">

        <h2 class="title is-2 has-text-centered">{{ $gettext(key) }}</h2>

        <div v-if="splittedMode" class="columns is-mobile">
          <div class="column is-6">
            <div class="splitted-diff">
              <component
                v-for="(diff, i) of diffLocales2[key]"
                :key="i"
                v-if="diff[0] <= 0"
                :is="diff[0] === 0 ? 'span' : 'del'">{{ diff[1] }}</component>
            </div>
          </div>

          <div class="column is-6">
            <div class="splitted-diff">
              <component
                v-for="(diff, i) of diffLocales2[key]"
                :key="i"
                v-if="diff[0] >= 0"
                :is="diff[0] === 0 ? 'span' : 'ins'">{{ diff[1] }}</component>
            </div>
          </div>
        </div>

        <div v-else class="locale-diff">
          <div>
            <pre>
                            <!-- eslint-disable-next-line vue/no-v-html -->
                            <code v-html="diffLocales[key]"/>
            </pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import c2c from '@/js/apis/c2c';
  import constants from '@/js/constants';

  import { diffMatchPatch } from './utils/diff_match_patch_uncompressed';

  const ensureSameCountOfNewLine = function(diff1, diff2) {
    let diff1Count = diff1[1].split('\n').length - 1;
    let diff2Count = diff2[1].split('\n').length - 1;

    if (diff1Count < diff2Count) {
      diff1[1] += '\n'.repeat(diff2Count - diff1Count);
    } else if (diff2Count < diff1Count) {
      diff2[1] += '\n'.repeat(diff1Count - diff2Count);
    }
  };

  const hasChanged = function(oldVal, newVal) {
    if (Array.isArray(oldVal) || Array.isArray(newVal)) {
      return JSON.stringify(oldVal) !== JSON.stringify(newVal);
    }

    if ((oldVal === null && newVal !== null) || (oldVal !== null && newVal === null)) {
      return true;
    }

    return oldVal !== newVal;
  };

  export default {

    data() {
      return {
        title: null,
        oldVersion: null,
        newVersion: null,
        diffProperties: {},
        diffLocales: {},
        diffLocales2: {},
        splittedMode: true
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

      geometryHasChanged() {
        // areas are flagged as not geolocalized because you cant display
        // ol map componenent on /areas
        // but it contains geometry
        if (!this.geoLocalized && this.documentType !== 'area') {
          return false;
        }

        if (this.oldVersion.document.geometry.geom !== this.newVersion.document.geometry.geom) {
          return true;
        }

        if (this.oldVersion.document.geometry.geom_detail !== this.newVersion.document.geometry.geom_detail) {
          return true;
        }

        return false;
      }
    },

    watch: {
      '$route': {
        handler: 'loadVersions',
        immediate: true
      }
    },

    methods: {
      loadVersions() {
        this.loadVersion(this.$route.params.versionFrom, 'oldVersion');
        this.loadVersion(this.$route.params.versionTo, 'newVersion');
      },

      getKeys(obj1, obj2, excludedKeys) {
        let keys = Object.keys(obj1).concat(Object.keys(obj2));

        excludedKeys = excludedKeys || [];

        keys = keys.filter(function(item, pos, self) {
          return self.indexOf(item) === pos && !excludedKeys.includes(item);
        });

        keys.sort();
        return keys;
      },

      buildDiff() {
        this.diffProperties = {};
        this.diffLocales = {};
        this.diffLocales2 = {};

        if (!this.oldVersion || !this.newVersion) {
          return 'Waiting for other version';
        }

        let keys = this.getKeys(
          this.oldVersion.document,
          this.newVersion.document,
          ['version', 'locales', 'geometry', 'cooked']
        );

        for (let key of keys) {
          if (hasChanged(this.oldVersion.document[key], this.newVersion.document[key])) {
            this.diffProperties[key] = {
              old: this.oldVersion.document[key],
              new: this.newVersion.document[key]
            };
          }
        }

        let oldLocale = this.$documentUtils.getLocaleStupid(this.oldVersion.document, this.lang);
        let newLocale = this.$documentUtils.getLocaleStupid(this.newVersion.document, this.lang);
        let localeKeys = this.getKeys(oldLocale, newLocale, ['lang', 'version']);

        for (let key of localeKeys) {
          let oldVal = (oldLocale[key] || '').replace(/\r\n?/g, '\n');
          let newVal = (newLocale[key] || '').replace(/\r\n?/g, '\n');

          if (hasChanged(oldVal, newVal)) {
            let diff = diffMatchPatch.diff_main(oldVal, newVal);
            diffMatchPatch.diff_cleanupSemantic(diff);
            let html = diffMatchPatch.diff_prettyHtml(diff).split('<br>');
            this.diffLocales[key] = html.join('<br>');

            let computedDiff = [];

            // ensure that a removed diff always precede an added diff
            // and ensure they contain same count of new lines
            for (let i = 0; i < diff.length; i++) {
              if (diff[i][0] === 0) {
                computedDiff.push(diff[i]);
              } else if (diff[i][0] === 1) {
                computedDiff.push([-1, '']);
                computedDiff.push(diff[i]);

                ensureSameCountOfNewLine(
                  computedDiff[computedDiff.length - 2],
                  computedDiff[computedDiff.length - 1]
                );
              } else if (diff[i][0] === -1) {
                computedDiff.push(diff[i]);
                if (i + 1 > diff.length || diff[i + 1][0] !== 1) {
                  computedDiff.push([1, '']);
                } else {
                  computedDiff.push(diff[i + 1]);
                  i += 1;
                }

                ensureSameCountOfNewLine(
                  computedDiff[computedDiff.length - 2],
                  computedDiff[computedDiff.length - 1]
                );
              }
            }

            this.diffLocales2[key] = computedDiff;
          }
        }
      },

      loadVersion(versionId, resultProperty) {
        this[resultProperty] = null;

        if (versionId === 'prev' || versionId === 'next') {
          return;
        }

        return c2c[this.documentType].getVersion(this.documentId, this.lang, versionId)
          .then(response => {
            this[resultProperty] = response.data;

            // handle when url version is prev or next
            // the other version contains the good id
            if (this.$route.params.versionFrom === 'prev' && resultProperty === 'newVersion') {
              this.loadVersion(this.newVersion.previous_version_id, 'oldVersion');
            }

            if (this.$route.params.versionTo === 'next' && resultProperty === 'oldVersion') {
              this.loadVersion(this.newVersion.next_version_id, 'newVersion');
            }

            if (resultProperty === 'newVersion') {
              this.title = this.$documentUtils.getLocaleStupid(this.newVersion.document, this.lang).title;
            }

            this.buildDiff();
        });
      }
    }
  };

</script>

<style scoped>

    .locale-diff  pre{
        white-space: pre-line;
        line-height:1.3;
    }

    .splitted-diff{
        padding:0.5rem;
        background: #EAEAEA;
        font-family: monospace;
        font-size:14px;
        white-space: pre;
        line-height:1.3;
        overflow: hidden;
        overflow-x: scroll;
    }

    ins{
        background:lightgreen !important;
        text-decoration:none;
    }

    del{
        background:pink !important;
        text-decoration:none;
    }

    h2{
        margin-top: 2rem;
        margin-bottom: 0.5rem!important;
    }

</style>
