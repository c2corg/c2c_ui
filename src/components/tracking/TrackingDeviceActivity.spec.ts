import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import TrackingDeviceActivity from './TrackingDeviceActivity.vue';

import type { Activity } from '@/js/apis/tracking-service';

const global = {
  config: {
    globalProperties: {
      $gettext: (text: string) => text,
      $user: { lang: 'fr' },
      $dateUtils: { durationToTimeString: () => '', toTechnicalString: (date: string) => date },
      $documentUtils: { heightDiffUpWithUnit: () => '', lengthWithUnit: () => '' },
    } as never,
  },
  stubs: { FaIcon: true, IconHeightDiffUp: true },
};

const activity: Activity = {
  id: 2,
  userId: 1,
  vendor: 'strava',
  vendorId: '20806619230',
  date: '2026-10-31T13:47:32+01:00',
  name: "Sortie VTT dans l'après-midi",
  type: { fr: 'VTT' },
};

const vendors = (props: Activity) =>
  mount(TrackingDeviceActivity, { props: { activity: props }, global })
    .findAll('.activity-sources > *')
    .map((link) => [link.text(), link.attributes('href')]);

describe('TrackingDeviceActivity', () => {
  it('links to the vendor of the activity', () => {
    expect(vendors(activity)).toEqual([['strava', 'https://www.strava.com/activities/20806619230']]);
  });

  it('links to every vendor that has the outing', () => {
    expect(
      vendors({
        ...activity,
        sources: [
          { id: 2, vendor: 'strava', vendorId: '20806619230' },
          { id: 1, vendor: 'garmin', vendorId: '24919339767' },
        ],
      })
    ).toEqual([
      ['strava', 'https://www.strava.com/activities/20806619230'],
      ['garmin', 'https://connect.garmin.com/modern/activity/24919339767'],
    ]);
  });

  it('names the vendors without activity page', () => {
    const wrapper = mount(TrackingDeviceActivity, {
      props: {
        activity: {
          ...activity,
          sources: [
            { id: 2, vendor: 'strava', vendorId: '20806619230' },
            { id: 3, vendor: 'coros', vendorId: '3' },
          ],
        },
      },
      global,
    });

    expect(wrapper.find('.activity-sources').text()).toBe('strava · coros');
  });

  it('shows distinct device names without repeating a vendor name', () => {
    const wrapper = mount(TrackingDeviceActivity, {
      props: {
        activity: {
          ...activity,
          sources: [
            { id: 2, vendor: 'garmin', vendorId: '24919339767', deviceName: 'Garmin Forerunner 965' },
            { id: 3, vendor: 'strava', vendorId: '20806619230', deviceName: 'STRAVA' },
          ],
        },
      },
      global,
    });

    expect(wrapper.find('.activity-sources').text()).toBe('garmin (Garmin Forerunner 965) · strava');
  });

  it('keeps the full device name available when the card label is truncated', () => {
    const deviceName = 'Garmin Forerunner 965 with an exceptionally long model description';
    const wrapper = mount(TrackingDeviceActivity, {
      props: {
        activity: {
          ...activity,
          sources: [{ id: 2, vendor: 'garmin', vendorId: '24919339767', deviceName }],
        },
      },
      global,
    });

    const deviceLabel = wrapper.find('.activity-device-name');
    expect(deviceLabel.attributes('title')).toBe(deviceName);
  });
});
