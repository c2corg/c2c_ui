import config from '@/js/config';

// The avatar of a forum user, as the site shows it everywhere (one picture for the wiki and the forum, through SSO).
// Discourse serves the current one at /user_avatar/<forum host>/<username>/<size>/1_1.png
export function forumAvatarUrl(forumUsername: string | null | undefined, size: number): string | null {
  if (!forumUsername) {
    return null;
  }
  const host = config.urls.forum.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return `${config.urls.forum}/user_avatar/${host}/${encodeURIComponent(forumUsername.toLowerCase())}/${size}/1_1.png`;
}
