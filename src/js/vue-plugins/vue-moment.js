// from vue-moment.js https://github.com/brockpetrie/vue-moment
// but with small modification for google bot.
//
// and added time ago filter
// all modification are commented with a C2C prefix

// C2C fixed import
import moment from 'moment';

// C2C fixed lang list
require('moment/locale/ca.js');
require('moment/locale/es.js');
require('moment/locale/eu.js');
require('moment/locale/de.js');
require('moment/locale/fr.js');
require('moment/locale/it.js');
require('moment/locale/zh-cn.js');
require('moment/locale/en-gb.js'); // keep en in last.

// C2C use export default io module.exports and remove options argument
export default function install(Vue) {
  const momentVm = new Vue({
    methods: {
      parseDate(arg, format) {
        return moment(arg, format);
      },

      timeAgo(arg) {
        return moment.utc(arg).local().locale(this.$language.current).fromNow();
      },

      toLocalizedString(arg, format) {
        return moment(arg).locale(this.$language.current).format(format);
      },

      toTechnicalString(arg) {
        return moment(arg).format('YYYY-MM-DD HH:mm:ss');
      },

      month(monthNumber) {
        return moment.localeData(this.$language.current).months()[monthNumber];
      }
    }
  });

  Vue.prototype.$moment = momentVm;
}
