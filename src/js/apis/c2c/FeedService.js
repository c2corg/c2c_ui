function FeedService(api) {
  this.api = api;
}

FeedService.prototype.getDefaultFeed = function (params) {
  return this.api.get('/feed', { params });
};

FeedService.prototype.getProfileFeed = function (params) {
  return this.api.get('/profile-feed', { params });
};

FeedService.prototype.getPersonalFeed = function (params) {
  return this.api.get('/personal-feed', { params });
};

export default FeedService;
