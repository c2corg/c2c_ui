import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import PrettyRouteLink from './PrettyRouteLink';

import PrettyRoute from '@/components/generics/pretty/PrettyRoute';

describe('PrettyRouteLink', () => {
  it('passes its display options to the route summary', () => {
    const wrapper = mount(PrettyRouteLink, {
      props: { route: { document_id: 1 }, hideHeightDiffDifficulties: true, hideArea: true },
      // registered globally in the app; stubbed with its props
      global: {
        components: { PrettyRoute },
        stubs: { DocumentLink: { template: '<a><slot /></a>' }, PrettyRoute: true },
      },
    });

    expect(wrapper.findComponent({ name: 'PrettyRoute' }).props()).toMatchObject({
      hideHeightDiffDifficulties: true,
      hideArea: true,
    });
  });
});
