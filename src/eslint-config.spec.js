// @vitest-environment node
import { ESLint } from 'eslint';
import { beforeAll, describe, expect, it } from 'vitest';

// The Vue 3 deprecation rules are warnings: they list what is left to migrate, without failing the lint
const eslint = new ESLint({ cwd: process.cwd() });

// `npm run lint` runs eslint --fix. These rules' fixes produce code that still works on Vue 2.7; the fixes of
// no-deprecated-destroyed-lifecycle (beforeUnmount), no-deprecated-dollar-scopedslots-api ($slots) and
// no-deprecated-v-bind-sync (v-model:prop) don't, so those rules must stay off until the switch to Vue 3.
const VUE2_SAFE_FIXES = [
  'vue/no-deprecated-data-object-declaration', // data() function
  'vue/no-deprecated-scope-attribute', // slot-scope
  'vue/no-deprecated-slot-attribute', // v-slot
  'vue/no-deprecated-slot-scope-attribute', // v-slot
  'vue/no-deprecated-v-on-number-modifiers', // key names
];

const lintComponent = async (source) => {
  const [result] = await eslint.lintText(source, { filePath: 'src/components/Example.vue' });
  return result.messages;
};

describe('eslint config', () => {
  // the first lint loads the parsers and plugins: under the load of the full suite, it can take over a minute
  beforeAll(() => lintComponent('<template><div /></template>'), 180000);

  it('warns on code that breaks in Vue 3', async () => {
    const messages = await lintComponent(`<template>
  <div>
    {{ name | uppercaseFirstLetter }}
    <child-component @click.native="onClick"><span slot="title">title</span></child-component>
  </div>
</template>

<script>
export default {
  props: {
    name: {
      type: String,
      required: true,
    },
  },
  beforeDestroy() {
    this.$emit('closed');
  },
  methods: {
    onClick() {
      this.$set(this, 'clicked', true);
    },
  },
};
</script>
`);

    expect(messages.filter((message) => message.severity === 2)).toEqual([]);
    expect(messages.map((message) => message.ruleId).sort()).toEqual([
      'vue/no-deprecated-delete-set',
      'vue/no-deprecated-filter',
      'vue/no-deprecated-slot-attribute',
      'vue/no-deprecated-v-on-native-modifier',
      'vue/require-explicit-emits',
    ]);
  });

  it('accepts the Vue 3 compatible syntax', async () => {
    const messages = await lintComponent(`<template>
  <child-component @click="onClick">
    <template #title><span>title</span></template>
  </child-component>
</template>

<script>
export default {
  emits: ['closed'],
  beforeUnmount() {
    this.$emit('closed');
  },
  methods: {
    onClick() {
      this.$emit('closed');
    },
  },
};
</script>
`);

    expect(messages).toEqual([]);
  });

  it('only enables Vue 3 rules whose autofix keeps the code working on Vue 2.7', async () => {
    const { rules: allRules } = await import('eslint-plugin-vue');
    const config = await eslint.calculateConfigForFile('src/components/Example.vue');

    const fixable = Object.entries(config.rules)
      .filter(([id, setting]) => id.startsWith('vue/no-deprecated-') && [setting].flat()[0] !== 'off')
      .map(([id]) => id)
      .filter((id) => allRules[id.slice('vue/'.length)].meta.fixable);

    expect(fixable.filter((id) => !VUE2_SAFE_FIXES.includes(id))).toEqual([]);
  });

  it('keeps Vue 2 lifecycle hooks, $scopedSlots and .sync when fixing', async () => {
    const fixer = new ESLint({ cwd: process.cwd(), fix: true });
    const source = `<template>
  <child-component :value.sync="value" />
</template>

<script>
export default {
  data() {
    return { value: 1 };
  },
  beforeDestroy() {
    this.value = 0;
  },
  destroyed() {
    this.value = 0;
  },
  methods: {
    hasTitle() {
      return !!this.$scopedSlots.title;
    },
  },
};
</script>
`;

    const [result] = await fixer.lintText(source, { filePath: 'src/components/Example.vue' });
    const output = result.output ?? source;

    expect(output).toContain('beforeDestroy()');
    expect(output).toContain('destroyed()');
    expect(output).toContain('this.$scopedSlots.title');
    expect(output).toContain(':value.sync="value"');
  });
});
