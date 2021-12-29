import saveAs from 'file-saver';

export default {
  // from https://github.com/c2corg/v6_ui/blob/c9962a6c3bac0670eab732d563f9f480379f84d1/c2corg_ui/static/js/utils.js#L194
  stringDivider(str, width, spaceReplacer) {
    if (str && str.length > width) {
      let p = width;
      while (p > 0 && str[p] !== ' ' && str[p] !== '-') {
        p--;
      }

      if (p > 0) {
        let left;
        if (str.substring(p, p + 1) === '-') {
          left = str.substring(0, p + 1);
        } else {
          left = str.substring(0, p);
        }
        const right = str.substring(p + 1);
        return left + spaceReplacer + this.stringDivider(right, width, spaceReplacer);
      }
    }
    return str;
  },

  download(content, fileName, opt_fileType) {
    const fileType = opt_fileType ?? 'text/plain;charset=utf-8';
    const blob = new Blob([content], { type: fileType });

    saveAs(blob, fileName);
  },

  // transform a list of c2c object to a CSV content, and download it

  downloadCsv(objects, fileName, keys) {
    const defaultGetter = (object, key) => object[key];

    const convertToCsv = function (value) {
      if (value === null || value === undefined) {
        return '';
      }

      if (typeof value === 'string') {
        // lgtm fail to parse the second argument
        return `"${value.replace(/"/g, '\\"')}"`; // lgtm[js/incomplete-sanitization]
      }

      if (typeof value === 'boolean' || typeof value === 'number') {
        return value;
      }

      if (Array.isArray(value)) {
        return `"${value.join(',')}"`;
      }

      return '';
    };

    if (!objects) {
      return;
    }

    const excludedKeys = new Set(['areas', 'locales', 'geometry', 'author']);

    for (const object of objects) {
      for (const key in object) {
        if (!excludedKeys.has(key)) {
          keys.set(key, defaultGetter);
        }
      }
    }

    keys = new Map([...keys.entries()].sort());

    const lines = [[...keys.keys()].join(';')];

    for (const object of objects) {
      const line = [];
      for (const [key, getter] of keys) {
        line.push(convertToCsv(getter(object, key)));
      }

      lines.push(line.join(';'));
    }

    this.download(lines.join('\n'), fileName, 'text/csv;charset=utf-8');
  },

  // does the intersection of two arrays is empty ?
  intersectionIsNotNull(arrayA, arrayB) {
    for (const itemA of arrayA) {
      if (arrayB.includes(itemA)) {
        return true;
      }
    }

    return false;
  },

  // decode html entities in a text. Remove any html markup
  decodeHtmlEntities(input) {
    if (!DOMParser) {
      // prevent errors on old browsers
      return input;
    }

    const doc = new DOMParser().parseFromString(input, 'text/html');
    return doc.documentElement.textContent;
  },

  stripMarkdown(value) {
    return value
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // external links
      .replace(/\[\[[^|]+\|([^\]]+)\]\]/g, '$1') // internal links
      .replace(/([\\s\n])-(\\s\n)/g, '$1$2') // dash, but only when preceded and followed by a space chare or line return
      .replace(/[*_\\#~`]/g, '') // emphasis and other similar stuff
      .replace(/<su[bp]>(.+)<\/su[bp]>/g, '$1'); // sup
  },
};
