import { Capacitor } from '@capacitor/core';

/**
 * Renders post/comment text with clickable @username mentions and URLs.
 * Use this in place of plain text rendering anywhere you display post content.
 */
export const renderTextWithMentions = (
  text: string,
  profilesMap: Record<string, any>,
  router: any
) => {
  if (!text) return null;

  const combinedRegex = /(https?:\/\/[^\s]+|@[\w._-]+)/g;
  const parts = text.split(combinedRegex);

  return parts.map((part, i) => {
    // Render URLs as links
    if (part.match(/^https?:\/\//)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#6366f1', textDecoration: 'underline' }}
        >
          {part}
        </a>
      );
    }

    // Render @mentions as clickable profile links
    if (part.match(/^@[\w._-]+$/)) {
      const username = part.slice(1);
      return (
        <span
          key={i}
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/profile?u=${username}`);
          }}
          style={{
            color: '#6366f1',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          {part}
        </span>
      );
    }

    // Plain text
    return <span key={i}>{part}</span>;
  });
};

/**
 * Extracts @username mentions from post text, saves them to the post_tags table,
 * creates in-app notifications, and sends push notifications to tagged users.
 */
export async function extractAndSaveTags(
  content: string,
  postId: string,
  authorId: string,
  profilesMap: Record<string, any>,
  supabase: any
) {
  if (!content) return;

  const mentionRegex = /@([\w._-]+)/g;
  const matches = [...content.matchAll(mentionRegex)];
  if (matches.length === 0) return;

  const uniqueUsernames = [...new Set(matches.map((m) => m[1].toLowerCase()))];

  const taggedUsers = uniqueUsernames
    .map((username) =>
      Object.values(profilesMap).find(
        (p: any) => p.username?.toLowerCase() === username
      )
    )
    .filter(Boolean)
    .filter((p: any) => p.id !== authorId);

  if (taggedUsers.length === 0) return;

  const tagRows = taggedUsers.map((p: any) => ({
    post_id: postId,
    tagged_user_id: p.id,
    tagged_by: authorId,
  }));

  await supabase.from('post_tags').insert(tagRows);

  const notifications = taggedUsers.map((p: any) => ({
    user_id: p.id,
    actor_id: authorId,
    type: 'tag',
    post_id: postId,
  }));

  await supabase.from('notifications').insert(notifications);

  const senderName =
    profilesMap[authorId]?.display_name ||
    profilesMap[authorId]?.username ||
    'Someone';

  const pushUrl = Capacitor.isNativePlatform()
    ? 'https://www.vimciety.com/api/send-push'
    : '/api/send-push';

  for (const taggedUser of taggedUsers) {
    fetch(pushUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receiverId: (taggedUser as any).id,
        title: 'You were tagged! 🏷️',
        body: `${senderName} tagged you in a post.`,
        data: { route: `/post/${postId}` },
      }),
    }).catch((err) => console.error('Tag push failed', err));
  }
}

/**
 * Extracts @username mentions from a comment, saves them to the comment_tags table,
 * creates in-app notifications, and sends push notifications to tagged users.
 */
export async function extractAndSaveCommentTags(
  content: string,
  commentId: string,
  postId: string,
  authorId: string,
  profilesMap: Record<string, any>,
  supabase: any
) {
  if (!content) return;

  const mentionRegex = /@([\w._-]+)/g;
  const matches = [...content.matchAll(mentionRegex)];
  if (matches.length === 0) return;

  const uniqueUsernames = [...new Set(matches.map((m) => m[1].toLowerCase()))];

  const taggedUsers = uniqueUsernames
    .map((username) =>
      Object.values(profilesMap).find(
        (p: any) => p.username?.toLowerCase() === username
      )
    )
    .filter(Boolean)
    .filter((p: any) => p.id !== authorId);

  if (taggedUsers.length === 0) return;

  const tagRows = taggedUsers.map((p: any) => ({
    comment_id: commentId,
    post_id: postId,
    tagged_user_id: p.id,
    tagged_by: authorId,
  }));

  await supabase.from('comment_tags').insert(tagRows);

  const notifications = taggedUsers.map((p: any) => ({
    user_id: p.id,
    actor_id: authorId,
    type: 'comment_tag',
    post_id: postId,
  }));

  await supabase.from('notifications').insert(notifications);

  const senderName =
    profilesMap[authorId]?.display_name ||
    profilesMap[authorId]?.username ||
    'Someone';

  const pushUrl = Capacitor.isNativePlatform()
    ? 'https://www.vimciety.com/api/send-push'
    : '/api/send-push';

  for (const taggedUser of taggedUsers) {
    fetch(pushUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receiverId: (taggedUser as any).id,
        title: 'You were mentioned! 💬',
        body: `${senderName} tagged you in a comment.`,
        data: { route: `/post/${postId}` },
      }),
    }).catch((err) => console.error('Comment tag push failed', err));
  }
}