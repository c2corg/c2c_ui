import { format, formatDistanceToNowStrict, parse, parseISO } from 'date-fns';
import { ca, es, eu, de, fr, it, hu, zhCN, sl, enGB } from 'date-fns/locale';

const locales = { ca, es, eu, de, fr, hu, it, sl, zh_CN: zhCN, en: enGB };
// C2C use export default io module.exports and remove options argument
export default function install(Vue) {
  const dateUtilsVm = new Vue({
    methods: {
      parseDate(arg, formatString) {
        return formatString ? parse(arg, formatString, new Date()) : parseISO(arg);
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
    },
  });

  Vue.prototype.$dateUtils = dateUtilsVm;
}
