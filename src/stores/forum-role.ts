// The role of the signed in user on the forum, from the browser's forum session (set by the forum notifications store).
// Kept apart from that store, which is only loaded once signed in: the menus read it on every page.
// Only to show the moderation links: the API checks the forum role itself on each moderation request.
import { ref } from 'vue';

export const isForumModerator = ref(false);
