// from vue-moment.js https://github.com/brockpetrie/vue-moment
// but with small modification for google bot.
//
// and added time ago filter
// all modification are commented with a C2C prefix

// C2C fixed import
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';

// C2C fixed lang list
require('dayjs/locale/ca.js');
require('dayjs/locale/es.js');
require('dayjs/locale/eu.js');
require('dayjs/locale/de.js');
require('dayjs/locale/fr.js');
require('dayjs/locale/it.js');
require('dayjs/locale/en-gb.js'); // keep en in last.

dayjs.extend(utc);
dayjs.extend(advancedFormat);
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);

// C2C use export default io module.exports and remove options argument
export default function install(Vue) {
  const momentVm = new Vue({
    methods: {
      parseDate(arg, format) {
        return dayjs(arg, format);
      },

      timeAgo(arg) {
        return dayjs.utc(arg).local().locale(this.$language.current).fromNow();
      },

      toLocalizedString(arg, format) {
        return dayjs(arg).locale(this.$language.current).format(format);
      },

      toTechnicalString(arg) {
        return dayjs(arg).format('YYYY-MM-DD HH:mm:ss');
      },

      month(monthNumber) {
        return dayjs.localeData(this.$language.current).months()[monthNumber];
      }
    }
  });

  Vue.prototype.$moment = momentVm;
}
