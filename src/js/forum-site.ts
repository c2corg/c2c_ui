// The forum sends the browser back, at the end of its SSO handshake, only to the hosts of its own site: the page and
// the forum are on the same site when their hosts are the same but for their first label (www.camptocamp.org and
// forum.camptocamp.org, www.demov6.camptocamp.org and forum.demov6.camptocamp.org)
const parent = (host: string) => host.split('.').slice(1).join('.');

export function isForumSite(forumUrl: string, pageHostname: string): boolean {
  try {
    return parent(new URL(forumUrl).hostname) === parent(pageHostname);
  } catch {
    return false;
  }
}
