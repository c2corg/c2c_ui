function UserProfileService(api) {
  this.api = api;

  this.preferences = {
    get() {
      return api.get('/users/preferences');
    },

    post(preferences) {
      return api.post('/users/preferences', preferences);
    },
  };

  this.following = {
    get() {
      return api.get('/users/following');
    },

    add(user_id) {
      return api.post('/users/follow', { user_id });
    },

    remove(user_id) {
      return api.post('/users/unfollow', { user_id });
    },

    isFollowing(user_id) {
      return api.get('/users/following-user/' + user_id);
    },
  };

  this.account = {
    get() {
      return api.get('/users/account');
    },

    post(currentpassword, name, forum_username, email, is_profile_public, newpassword) {
      const payload = {
        currentpassword,
      };

      if (name !== null) {
        payload.name = name;
      }

      if (is_profile_public !== null) {
        payload.is_profile_public = is_profile_public;
      }

      if (email !== null) {
        payload.email = email;
      }

      if (forum_username !== null) {
        payload.forum_username = forum_username;
      }

      if (newpassword !== null) {
        payload.newpassword = newpassword;
      }

      return api.post('/users/account', payload);
    },
  };
}

UserProfileService.prototype.login = function (username, password, acceptTos) {
  return this.api.post('/users/login', {
    username,
    password,
    discourse: true,
    accept_tos: acceptTos,
  });
};

UserProfileService.prototype.logout = function () {
  return this.api.post('/users/logout', { discourse: true });
};

UserProfileService.prototype.expiredTokenLogout = function (expiredToken) {
  // When the user has expired token, the token is removed from the api,
  // but we still want to use it in the logout call
  return this.api.axios.post(
    '/users/logout',
    { discourse: true },
    { headers: { common: { Authorization: 'JWT token="' + expiredToken + '"' } } }
  );
};

UserProfileService.prototype.update_preferred_language = function (lang) {
  return this.api.post('/users/update_preferred_language', { lang });
};

UserProfileService.prototype.requestPasswordChange = function (email) {
  return this.api.post('/users/request_password_change', { email });
};

UserProfileService.prototype.validateNewPassword = function (nonce, password) {
  return this.api.post('/users/validate_new_password/' + nonce, { password });
};

UserProfileService.prototype.register = function (data) {
  return this.api.post('/users/register', data);
};

UserProfileService.prototype.validateChangeEmail = function (nonce) {
  return this.api.post('/users/validate_change_email/' + nonce);
};

UserProfileService.prototype.validateRegisterEmail = function (nonce) {
  return this.api.post('/users/validate_register_email/' + nonce);
};

UserProfileService.prototype.getProfile = function (user_Id) {
  return this.api.get(`/profiles/${user_Id}`);
};

export default UserProfileService;
