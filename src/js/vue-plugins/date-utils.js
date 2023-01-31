import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localeData from 'dayjs/plugin/localeData';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
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

const locales = {
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
export default function install(Vue) {
  const dateUtilsVm = new Vue({
    methods: {
      parseDate(arg, formatString) {
        return dayjs(arg, formatString).toDate();
      },

      timeAgo(arg) {
        return dayjs(arg).locale(locales[this.$language.current]).fromNow();
      },

      toLocalizedString(arg, formatString) {
        // add some custom formats
        if (formatString === '@1') {
          switch (this.$language.current) {
            case 'ca':
              formatString = 'dddd D MMMM [de] YYYY';
            case 'es':
              formatString = 'dddd D [de] MMMM [de] YYYY';
            case 'eu':
              formatString = 'dddd YYYY[ko] MMMM[ren] D[a]';
            case 'de':
              formatString = 'dddd D. MMMM YYYY';
            case 'fr':
              formatString = 'dddd D MMMM YYYY';
            case 'it':
              formatString = 'dddd D MMMM YYYY';
            case 'hu':
              formatString = 'YYYY. MMMM D., dddd';
            case 'zh_CN':
              formatString = 'YYYY年M月D日dddd';
            case 'sl':
              formatString = 'dddd D. MMMM YYYY';
            case 'en':
            default:
              formatString = 'dddd D MMMM YYYY';
          }
        }
        return dayjs(arg).locale(locales[this.$language.current]).format(formatString);
      },

      toTechnicalString(arg) {
        return dayjs(arg).locale(locales[this.$language.current]).format('YYYY-MM-DD HH:mm:ss');
      },

      month(monthNumber) {
        return dayjs().locale(locales[this.$language.current]).localeData().months()[monthNumber];
      },

      hasSinglePeriod(period) {
        if (period.filter((month) => !!month).length < 2) {
          // a period corresponds to at least 2 successive months
          return false;
        }
        return (
          period.reduce((acc, curr) => {
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

      durationToTimeString(duration) {
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration - hours * 3600) / 60);
        const seconds = duration - hours * 3600 - minutes * 60;
        return (
          hours.toString().padStart(2, 0) +
          ':' +
          minutes.toString().padStart(2, 0) +
          ':' +
          seconds.toString().padStart(2, 0)
        );
      },

      isSameYear(start, end) {
        return dayjs(start).isSame(dayjs(end), 'year');
      },

      isSameMonth(start, end) {
        return dayjs(start).isSame(dayjs(end), 'month');
      },

      isSameDay(start, end) {
        return dayjs(start).isSame(dayjs(end), 'day');
      },
    },
  });

  Vue.prototype.$dateUtils = dateUtilsVm;
}
