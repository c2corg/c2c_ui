
<template>
  <div class="content" ref="container"/>
  <!-- TODO find a way without aditionnal element
    <div style="clear:both"/> -->
</template>

<script>
  import { icon } from '@fortawesome/fontawesome-svg-core';

  import config from '@/js/config.ts';

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

  const getFontAwesomeSrc = function(prefix, iconeName) {
    let svgSource = icon({ prefix, iconName: iconeName }).html[0];
    svgSource = svgSource.replace('fill="currentColor"', 'fill="#ffaa45"');
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgSource);
  };

  const getEmojiSrc = function(emojiSource, svgName) {
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
        required: true
      }
    },

    watch: {
      content: 'compute'
    },

    mounted() {
      this.compute();
    },

    methods: {
      compute() {
        const container = this.$refs.container;

        const addClasses = function(cssSelector, classes) {
          const nodes = container.querySelectorAll(cssSelector);

          for (const node of nodes) {
            node.classList.add(...classes);
          }
        };

        container.innerHTML = this.content;

        if (this.content.includes('c2c:role')) {
          this.computeImages(container.querySelectorAll('img[c2c\\:role=embedded-image]'));
          this.computeEmojis(container.querySelectorAll('img[c2c\\:role=emoji]'));
          this.computeAnchors(container.querySelectorAll('a[c2c\\:role=internal-link]'));

          addClasses('div[c2c\\:role=info]', ['notification', 'is-info']);
          addClasses('div[c2c\\:role=warning]', ['notification', 'is-warning']);
          addClasses('div[c2c\\:role=danger]', ['notification', 'is-danger']);
          addClasses('table[c2c\\:role=ltag]', ['table']);
        }
      },

      computeEmojis(emojis) {
        for (const emoji of emojis) {
          const emojiSource = emoji.attributes['c2c:emoji-db'].value;
          const svgName = emoji.attributes['c2c:svg-name'].value;
          emoji.src = getEmojiSrc(emojiSource, svgName); // `${svgCdns[emojiSource]}${svgName}.svg`
        }
      },

      computeImages(images) {
        for (const image of images) {
          image.c2cExtrapoledDocument = {
            document_id: parseInt(image.attributes['c2c:document-id'].value, 10),
            locales: [{ title: '...' }],
            available_langs: [this.$language.current],
            type: 'i'
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

          // eslint-disable-next-line
                    const { location, route, href } = this.$router.resolve({
            name: attributes['c2c:document-type'].value.slice(0, -1),
            params: {
              id: parseInt(attributes['c2c:document-id'].value, 10),
              lang: attributes['c2c:lang'] ? attributes['c2c:lang'].value : undefined,
              title: attributes['c2c:slug'] ? attributes['c2c:slug'].value : undefined,
              anchor: attributes['c2c:anchor'] ? attributes['c2c:anchor'].value : undefined
            }
          });

          anchor.href = href;
          anchor.addEventListener('click', (e) => {
            if (guardEvent(e)) {
              this.$router.push(location);
            }
          });
        }
      }
    }
  };
</script>

<style scoped lang="scss">
    .content{
        margin-bottom: 1.5rem;
    }
</style>

<style lang="scss">
    // Not scoped syle, because CSS selector are not explicitly present in template

    span[c2c\:role=header-emphasis]{
        font-size: 80%;
        font-style: italic;
    }

    img[c2c\:role=emoji]{
        width: 1.43em;
        height: 1.43em;
        vertical-align:bottom;
    }

    figure[c2c\:role=embedded-figure]{
        border-radius: 4px;
        border:1px solid #DDD;
        padding:0.5rem;
        background: #FAFAFA;
        max-width:100%;
        display: table;

        img{
            cursor: pointer
        }

        // small image
        img[c2c\:size=SI]{
            // SI is a 200*200 image, no need to specify anything

        }

        // medium image
        img[c2c\:size=MI]{
            width: 25vw;
        }

        // big image
        img[c2c\:size=BI]{

        }

        // original size image
        img[c2c\:size=OI]{ // TODO MARKDOWN PARSER HAS TO EXPOSE THIS EXPLICTLY
            // nothing to do

        }
    }

    figure[c2c\:position=right]{
        float: right;
        clear: right;
        margin-right:0 !important;
    }

    figure[c2c\:position=left]{
        float: left;
        clear: left;
        margin-left:0 !important;
    }

    figure[c2c\:position=center]{
        margin-left:auto !important;
        margin-right:auto !important;
        clear: both;
    }

    figure[c2c\:position=inline]{
        margin-right:0 !important;
        margin-left:0 !important;
        // well, no :(
        // display: inline-block;
    }

    table[c2c\:role=ltag]{
        width: auto;

        .pitch{
            font-weight:bold;
        }
    }

    div[c2c\:role=info], div[c2c\:role=warning], div[c2c\:role=danger]{
        overflow: hidden;
    }

</style>
