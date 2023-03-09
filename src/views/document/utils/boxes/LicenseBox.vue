<template>
  <div class="has-text-centered">
    <a
      v-if="license === 'by-sa'"
      :href="'https://creativecommons.org/licenses/by-sa/3.0/deed.' + $language.current"
      target="_blank"
      rel="noreferer"
    >
      <icon-creative-commons />
      CC
      <span
        :title="
          $gettext(
            'Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made.'
          )
        "
      >
        BY
      </span>
      <span
        :title="
          $gettext(
            'ShareAlike — If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.'
          )
        "
      >
        SA
      </span>
      3.0
      <br />
      <span v-translate>This content is licensed under Creative Commons BY-SA 3.0</span>
    </a>
    <a
      v-else-if="license == 'by-nc-nd'"
      :href="'https://creativecommons.org/licenses/by-nc-nd/3.0/deed.' + $language.current"
      target="_blank"
      rel="noreferer"
    >
      <icon-creative-commons />
      CC
      <span
        :title="
          $gettext(
            'Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made.'
          )
        "
      >
        BY
      </span>
      <span :title="$gettext('NonCommercial — You may not use the material for commercial purposes.')"> NC </span>
      <span
        :title="
          $gettext(
            'NoDerivatives — If you remix, transform, or build upon the material, you may not distribute the modified material.'
          )
        "
      >
        ND
      </span>
      3.0
      <br />
      <span v-translate>This content is licensed under Creative Commons BY-NC-ND 3.0</span>
    </a>
    <span
      v-else-if="license == 'copyright'"
      :title="
        $gettext(
          'This picture depicts a book cover. It is the property of its editor and/or author. It is presented here only for illustration purposes.'
        )
      "
    >
      <fa-icon icon="ban" />
      <span v-translate>This book cover is the property of its editor and/or author</span>
    </span>
  </div>
</template>

<script>
import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  mixins: [requireDocumentProperty],

  computed: {
    // https://github.com/c2corg/v6_ui/blob/master/c2corg_ui/templates/utils/__init__.py#L47
    // collaborative means CC-By-Sa

    license() {
      return this.$documentUtils.getDocumentLicense(this.document);
    },
  },
};
</script>
