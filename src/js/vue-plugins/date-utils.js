// from vue-moment.js https://github.com/brockpetrie/vue-moment
// but with small modification for google bot.
//
// Further modified to replace moment with dayjs. API is almost identical.
//
// and added time ago filter
// all modification are commented with a C2C prefix

// C2C fixed import
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import localeData from 'dayjs/plugin/localeData';

// C2C fixed lang list
import 'dayjs/locale/ca';
import 'dayjs/locale/es';
import 'dayjs/locale/eu';
import 'dayjs/locale/de';
import 'dayjs/locale/fr';
import 'dayjs/locale/it';
import 'dayjs/locale/en-gb';

dayjs.extend(utc);
dayjs.extend(advancedFormat);
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(localeData);

// C2C use export default io module.exports and remove options argument
export default function install(Vue) {
  const dateUtilsVm = new Vue({
    methods: {
      parseDate(arg, format) {
        return dayjs(arg, format);
      },

      timeAgo(arg) {
        return dayjs
          .utc(arg)
          .local()
          .locale(this.$language.current)
          .fromNow();
      },

      toLocalizedString(arg, format) {
        return dayjs(arg)
          .locale(this.$language.current)
          .format(format);
      },

      toTechnicalString(arg) {
        return dayjs(arg).format('YYYY-MM-DD HH:mm:ss');
      },

      month(monthNumber) {
        return dayjs()
          .locale(this.$language.current)
          .localeData()
          .months()[monthNumber];
      }
    }
  });

  Vue.prototype.$dateUtils = dateUtilsVm;
}
