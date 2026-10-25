import dayjs, { type ConfigType } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localeData from 'dayjs/plugin/localeData';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { App } from 'vue';
import 'dayjs/locale/ca';
import 'dayjs/locale/es';
import 'dayjs/locale/eu';
import 'dayjs/locale/de';
import 'dayjs/locale/fr';
import 'dayjs/locale/it';
import 'dayjs/locale/hu';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/sl';
import 'dayjs/locale/en-gb';

dayjs.extend(customParseFormat);
dayjs.extend(localeData);
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);

const locales: Record<string, string> = {
  ca: 'ca',
  es: 'es',
  eu: 'eu',
  de: 'de',
  fr: 'fr',
  hu: 'hu',
  it: 'it',
  sl: 'sl',
  zh_CN: 'zh-cn',
  en: 'en-gb',
};
export type DateUtils = ReturnType<typeof dateUtils>;

declare module 'vue' {
  interface ComponentCustomProperties {
    $dateUtils: DateUtils;
  }
}

// $language, from the gettext plugin, not typed yet: what this plugin uses of it
type Language = { current: string; setCurrent(lang: string): void };
const languageOf = (app: App) => (app.config.globalProperties as unknown as { $language: Language }).$language;

const dateUtils = (app: App) => {
  // $language is installed after this plugin: read it when called
  const current = () => locales[languageOf(app).current];

  return {
    parseDate(arg: ConfigType, formatString?: string) {
      return dayjs(arg, formatString).toDate();
    },

    timeAgo(arg: ConfigType) {
      return dayjs(arg).locale(current()).fromNow();
    },

    toLocalizedString(arg: ConfigType, formatString?: string) {
      // add some custom formats
      if (formatString === '@1') {
        switch (languageOf(app).current) {
          case 'ca':
            formatString = 'dddd D MMMM [de] YYYY';
            break;
          case 'es':
            formatString = 'dddd D [de] MMMM [de] YYYY';
            break;
          case 'eu':
            formatString = 'dddd YYYY[ko] MMMM[ren] D[a]';
            break;
          case 'de':
            formatString = 'dddd D. MMMM YYYY';
            break;
          case 'fr':
            formatString = 'dddd D MMMM YYYY';
            break;
          case 'it':
            formatString = 'dddd D MMMM YYYY';
            break;
          case 'hu':
            formatString = 'YYYY. MMMM D., dddd';
            break;
          case 'zh_CN':
            formatString = 'YYYY年M月D日dddd';
            break;
          case 'sl':
            formatString = 'dddd D. MMMM YYYY';
            break;
          case 'en':
          default:
            formatString = 'dddd D MMMM YYYY';
        }
      }
      return dayjs(arg).locale(current()).format(formatString);
    },

    toTechnicalString(arg: ConfigType) {
      return dayjs(arg).locale(current()).format('YYYY-MM-DD HH:mm:ss');
    },

    month(monthNumber: number) {
      return dayjs().locale(current()).localeData().months()[monthNumber];
    },

    hasSinglePeriod(period: unknown[]) {
      if (period.filter((month) => !!month).length < 2) {
        // a period corresponds to at least 2 successive months
        return false;
      }
      return (
        period.reduce<unknown[]>((acc, curr) => {
          if (!acc.length) {
            return [curr];
          }
          if (acc[acc.length - 1] === curr) {
            return acc;
          }
          return [...acc, curr];
        }, []).length <= 3
      );
    },

    durationToTimeString(duration: number) {
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration - hours * 3600) / 60);
      const seconds = duration - hours * 3600 - minutes * 60;
      return (
        hours.toString().padStart(2, '0') +
        ':' +
        minutes.toString().padStart(2, '0') +
        ':' +
        seconds.toString().padStart(2, '0')
      );
    },

    isSameYear(start: ConfigType, end: ConfigType) {
      return dayjs(start).isSame(dayjs(end), 'year');
    },

    isSameMonth(start: ConfigType, end: ConfigType) {
      return dayjs(start).isSame(dayjs(end), 'month');
    },

    isSameDay(start: ConfigType, end: ConfigType) {
      return dayjs(start).isSame(dayjs(end), 'day');
    },
  };
};

export default function install(app: App) {
  app.config.globalProperties.$dateUtils = dateUtils(app);
}
