<template>
  <div class="content markdown-content" ref="container" />
  <!-- TODO find a way without aditionnal element
    <div style="clear:both"/> -->
</template>

<script>
import { icon } from '@fortawesome/fontawesome-svg-core';

import config from '@/js/config';

// copied from vue router : https://github.com/vuejs/vue-router/blob/dev/src/components/link.js
function guardEvent(e) {
  // don't redirect with control keys
  if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return;
  // don't redirect when preventDefault called
  if (e.defaultPrevented) return;
  // don't redirect on right click
  if (e.button !== undefined && e.button !== 0) return;
  // don't redirect if `target="_blank"`
  if (e.currentTarget && e.currentTarget.getAttribute) {
    const target = e.currentTarget.getAttribute('target');
    if (/\b_blank\b/i.test(target)) return;
  }
  // this may be a Weex event which doesn't have this method
  if (e.preventDefault) {
    e.preventDefault();
  }
  return true;
}

const getFontAwesomeSrc = function (prefix, iconeName) {
  let svgSource = icon({ prefix, iconName: iconeName }).html[0];
  svgSource = svgSource.replace('fill="currentColor"', 'fill="#F93"');
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgSource);
};

const getEmojiSrc = function (emojiSource, svgName) {
  if (emojiSource === 'emojione') {
    return `https://cdn.jsdelivr.net/emojione/assets/svg/${svgName}.svg`;
  }

  if (emojiSource === 'c2c-activities') {
    return getFontAwesomeSrc('activity', svgName);
  }

  if (emojiSource === 'c2c-waypoints') {
    return getFontAwesomeSrc('waypoint', svgName);
  }
};

export default {
  props: {
    content: {
      type: String,
      required: true,
    },
  },

  watch: {
    content: 'compute',
  },

  mounted() {
    this.compute();
  },

  methods: {
    compute() {
      const container = this.$refs.container;

      const addClasses = function (cssSelector, classes) {
        const nodes = container.querySelectorAll(cssSelector);

        for (const node of nodes) {
          node.classList.add(...classes);
        }
      };

      container.innerHTML = this.content;

      if (this.content.includes('c2c:role')) {
        this.computeFigures(container.querySelectorAll('figure[c2c\\:role=embedded-figure]'));
        this.computeImages(container.querySelectorAll('img[c2c\\:role=embedded-image]'));
        this.computeEmojis(container.querySelectorAll('img[c2c\\:role=emoji]'));
        this.computeAnchors(container.querySelectorAll('a[c2c\\:role=internal-link]'));
        this.computeVideos(container.querySelectorAll('div[c2c\\:role=video] > iframe'));

        addClasses('div[c2c\\:role=info]', ['notification', 'is-info']);
        addClasses('div[c2c\\:role=warning]', ['notification', 'is-warning']);
        addClasses('div[c2c\\:role=danger]', ['notification', 'is-danger']);
        addClasses('div[c2c\\:role=video]', ['no-print']);
        addClasses('table[c2c\\:role=ltag]', ['table']);
      }
    },

    computeVideos(iframes) {
      for (const iframe of iframes) {
        iframe.setAttribute('allowfullscreen', true);
      }
    },

    computeEmojis(emojis) {
      for (const emoji of emojis) {
        const emojiSource = emoji.attributes['c2c:emoji-db'].value;
        const svgName = emoji.attributes['c2c:svg-name'].value;
        emoji.src = getEmojiSrc(emojiSource, svgName); // `${svgCdns[emojiSource]}${svgName}.svg`
      }
    },

    computeFigures(figures) {
      for (const figure of figures) {
        const image = figure.children[0];
        const size = image.attributes['c2c:size'];

        if (size) {
          figure.setAttribute('c2c:size', size.value);
        }
      }
    },

    computeImages(images) {
      for (const image of images) {
        image.c2cExtrapoledDocument = {
          document_id: parseInt(image.attributes['c2c:document-id'].value, 10),
          locales: [{ title: '...' }],
          available_langs: [this.$language.current],
          type: 'i',
        };

        image.src = config.urls.api + image.attributes['c2c:url-proxy'].value;
        image.addEventListener('click', () => {
          this.$imageViewer.show(image.c2cExtrapoledDocument);
        });

        this.$imageViewer.push(image.c2cExtrapoledDocument);
      }
    },

    computeAnchors(anchors) {
      for (const anchor of anchors) {
        const attributes = anchor.attributes;

        const { location, href } = this.$router.resolve({
          name: attributes['c2c:document-type'].value.slice(0, -1),
          params: {
            id: parseInt(attributes['c2c:document-id'].value, 10),
            lang: attributes['c2c:lang'] ? attributes['c2c:lang'].value : undefined,
            title: attributes['c2c:slug'] ? attributes['c2c:slug'].value : undefined,
          },
          hash: attributes['c2c:anchor'] ? '#' + attributes['c2c:anchor'].value : undefined,
        });

        anchor.href = href;
        anchor.addEventListener('click', (e) => {
          if (guardEvent(e)) {
            this.$router.push(location);
          }
        });
      }
    },
  },
};
</script>

<style lang="scss">
// Not scoped syle, because CSS selector are not explicitly present in template
.markdown-content:not(:last-child) {
  margin-bottom: 1.5rem;
}

.markdown-content {
  h3 {
    font-size: 1.5rem !important;
    margin-bottom: 0.5em !important;
    border-bottom: 1px solid #eee;
  }
  h4 {
    font-size: 1.1rem !important;
    margin-bottom: 0.25em !important;
  }
  h5 {
    font-size: 1rem !important;
    margin-bottom: 0.25em !important;
  }
  hr {
    margin: 1rem 0 !important;
  }
}

span[c2c\:role='header-emphasis'] {
  font-size: 80%;
  font-style: italic;
}

img[c2c\:role='emoji'] {
  width: 1.43em;
  height: 1.43em;
  vertical-align: bottom;
}

figure[c2c\:role='embedded-figure'] {
  border-radius: 4px;
  border: 1px solid #ddd;
  padding: 0.5rem;
  background: #fafafa;
  max-width: 100%;
  display: table;

  img {
    cursor: pointer;
  }
}

// small image
// SI is a 200*200 image, no need to specify anything
// figure[c2c\:size=SI]{

// }

// medium image
figure[c2c\:size='MI'] {
  max-width: min(400px, 25vw);
  max-height: min(400px, 25vw);

  img {
    max-width: min(400px, 25vw);
    max-height: min(400px, 25vw);
  }
}

// big image
// figure[c2c\:size=BI]{

// }

// original size image
// TODO MARKDOWN PARSER HAS TO EXPOSE THIS EXPLICTLY
// figure[c2c\:size=OI]{

// }

figure[c2c\:position='right'] {
  float: right;
  clear: right;
  margin-right: 0 !important;
}

figure[c2c\:position='left'] {
  float: left;
  clear: left;
  margin-left: 0 !important;
}

figure[c2c\:position='center'] {
  margin-left: auto !important;
  margin-right: auto !important;
  clear: both;
}

figure[c2c\:position='inline'] {
  margin-right: 0 !important;
  margin-left: 0 !important;
  // well, no :(
  // display: inline-block;
}

table[c2c\:role='ltag'] {
  width: auto !important; // on prod, bulma CSS is after this CSS ??

  .pitch {
    font-weight: bold;
  }
}

div[c2c\:role='info'],
div[c2c\:role='warning'],
div[c2c\:role='danger'] {
  overflow: hidden;
}

div[c2c\:role='video'] {
  text-align: center;

  iframe {
    width: 400px;
    height: 250px;
    max-width: 100%;
    @media screen and (min-width: $tablet) {
      width: 420px;
      height: 315px;
    }
  }
}

@media screen and (max-width: $tablet) {
  table[c2c\:role='ltag'] {
    tr {
      display: flex;
      flex-flow: row wrap;
      padding: 0.4em 0 0.5em;

      &:not(:last-child) {
        border-bottom: 1px solid #d0d0d0;
      }
    }

    td,
    th {
      border: 0;
      padding-top: 0;
      padding-bottom: 0;
    }
  }
}

@media print {
  .markdown-content:not(:last-child) {
    margin-bottom: 0.5rem !important;
  }

  .markdown-content {
    h3 {
      font-size: 1.2rem !important;
      margin-bottom: 0.25em !important;
    }
  }
}
</style>
