import { format, formatDistanceToNowStrict, parse, parseISO } from 'date-fns';
import { ca, es, eu, de, fr, it, zhCN, enGB } from 'date-fns/locale';

const locales = { ca, es, eu, de, fr, it, zh_CN: zhCN, en: enGB };
// C2C use export default io module.exports and remove options argument
export default function install(Vue) {
  const dateUtilsVm = new Vue({
    methods: {
      parseDate(arg, format) {
        return format ? parse(arg, format, new Date()) : parseISO(arg);
      },

      timeAgo(arg) {
        return formatDistanceToNowStrict(arg instanceof Date ? arg : parseISO(arg), {
          addSuffix: true,
          locale: locales[this.$language.current],
        });
      },

      toLocalizedString(arg, formatString) {
        return format(arg instanceof Date ? arg : parseISO(arg), formatString, {
          locale: locales[this.$language.current],
        });
      },

      toTechnicalString(arg) {
        return format(arg instanceof Date ? arg : parseISO(arg), 'yyyy-MM-dd HH:mm:ss');
      },

      month(monthNumber) {
        return locales[this.$language.current].localize.month(monthNumber, 'wide');
      },
    },
  });

  Vue.prototype.$dateUtils = dateUtilsVm;
}
