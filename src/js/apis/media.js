import BaseApi from '@/js/apis/BaseApi';
import config from '@/js/config';

function Media() {
  BaseApi.call(this, config.urls.media);
}

// inherits prototype
Media.prototype = Object.create(BaseApi.prototype);

// restore good contructor
Media.prototype.constructor = Media;

Object.defineProperty(Media.prototype, 'url', {
  get() {
    return config.urls.media;
  },
});

Media.prototype.getImage = function (filename) {
  return this.get('/' + filename, { responseType: filename.endsWith('.svg') ? 'text' : 'blob' });
};

export default new Media();
