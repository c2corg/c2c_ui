import { account, loginResponse } from './schemas';
import type { Api, DocumentId } from './types';

// what the account form changes: the current password, and the fields not left null
type AccountChanges = {
  currentpassword: string;
  name?: string;
  forum_username?: string;
  email?: string;
  is_profile_public?: boolean;
  newpassword?: string;
};

type LoginPayload = {
  username: string;
  password: string;
  accept_tos: boolean;
  discourse?: boolean;
  sso?: string;
  sig?: string;
};

export default class UserProfileService {
  preferences;
  following;
  account;

  constructor(private api: Api) {
    this.preferences = {
      get() {
        return api.get('/users/preferences');
      },

      post(preferences: object) {
        return api.post('/users/preferences', preferences);
      },
    };

    this.following = {
      get() {
        return api.get('/users/following');
      },

      add(user_id: DocumentId) {
        return api.post('/users/follow', { user_id });
      },

      remove(user_id: DocumentId) {
        return api.post('/users/unfollow', { user_id });
      },

      isFollowing(user_id: DocumentId) {
        return api.get('/users/following-user/' + user_id);
      },
    };

    this.account = {
      get() {
        return api.getValidated('/users/account', account);
      },

      post(
        currentpassword: string,
        name: string | null,
        forum_username: string | null,
        email: string | null,
        is_profile_public: boolean | null,
        newpassword: string | null
      ) {
        const payload: AccountChanges = {
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

  login(username: string, password: string, acceptTos: boolean, sso?: string, sig?: string) {
    const payload: LoginPayload = {
      username,
      password,
      accept_tos: acceptTos,
    };

    // present when the login was reached via a Discourse-initiated SSO
    // handshake (see the auth-sso route) - forwarded as-is, the API
    // verifies the signature server-side. Without them, `discourse` would
    // make the API fetch a nonce for the forum server-side, which Discourse
    // no longer accepts from the browser: the UI opens the forum session
    // itself after login instead (see LoginView onSuccessSigin()).
    if (sso && sig) {
      payload.discourse = true;
      payload.sso = sso;
      payload.sig = sig;
    }

    return this.api.postValidated('/users/login', loginResponse, payload);
  }

  // answers a Discourse SSO handshake started by the browser (see the auth-sso
  // route) for an already logged-in user: returns the signed forum URL that
  // opens the forum session.
  discourseRedirect(sso: string, sig: string) {
    return this.api.post('/users/discourse-redirect', { sso, sig });
  }

  logout() {
    return this.api.post('/users/logout', { discourse: true });
  }

  expiredTokenLogout(expiredToken: string) {
    // When the user has expired token, the token is removed from the api,
    // but we still want to use it in the logout call
    return this.api.axios.post(
      '/users/logout',
      { discourse: true },
      // a header of this request only: axios merges headers.common into the request headers the same way
      { headers: { Authorization: 'JWT token="' + expiredToken + '"' } }
    );
  }

  update_preferred_language(lang: string) {
    return this.api.post('/users/update_preferred_language', { lang });
  }

  requestPasswordChange(email: string) {
    return this.api.post('/users/request_password_change', { email });
  }

  validateNewPassword(nonce: string, password: string) {
    return this.api.post('/users/validate_new_password/' + nonce, { password });
  }

  register(data: object) {
    return this.api.post('/users/register', data);
  }

  validateChangeEmail(nonce: string) {
    return this.api.post('/users/validate_change_email/' + nonce);
  }

  validateRegisterEmail(nonce: string) {
    return this.api.post('/users/validate_register_email/' + nonce);
  }

  getProfile(user_Id: DocumentId) {
    return this.api.get(`/profiles/${user_Id}`);
  }
}
