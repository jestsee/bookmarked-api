import { InlineMedia, TweetData, TweetMedia, TweetUrl } from './interface';

export const extractTweetData = (
  twitterResponse: any,
  url: string,
): TweetData => {
  const { result } = twitterResponse;
  if (!result) return;
  const userData = result.core.user_results.result.legacy;

  const tweetContent = extractTweetContent(result);

  return {
    name: userData.name,
    username: userData.screen_name,
    avatar: userData.profile_image_url_https,
    url,
    ...tweetContent,
    ...(result.quoted_status_result && {
      quotedTweet: extractTweetData(result.quoted_status_result, url),
    }),
  };
};

const extractTweetContent = (result: any) => {
  const urls = (result.legacy.entities.urls ?? []) as TweetUrl[];
  const media = (result.legacy.entities.media ?? []) as TweetMedia[];

  if (result.note_tweet?.note_tweet_results?.result) {
    const { result: noteTweetResult } = result.note_tweet.note_tweet_results;
    const noteTweetInlineMedia: InlineMedia[] =
      noteTweetResult.media?.inline_media ?? [];
    const noteTweetUrls = noteTweetResult.entity_set.urls;

    let modifiedText = noteTweetResult.text ?? '';
    let currentMediaIndex = 0;
    const inlineMedia = [];

    noteTweetInlineMedia.forEach((inlineMediaItem) => {
      const matchedMedia = media.find(
        (mediaItem) => mediaItem.id_str === inlineMediaItem.media_id,
      );
      modifiedText = insertSubstring(
        modifiedText,
        inlineMediaItem.index + currentMediaIndex,
        matchedMedia.media_url_https,
      );
      currentMediaIndex += matchedMedia.media_url_https.length;
      inlineMedia.push(matchedMedia.media_url_https);
    });

    return {
      inlineMedia,
      text: modifiedText,
      urls: noteTweetUrls.length > 0 ? noteTweetUrls : urls,
      media: inlineMedia.length > 0 ? [] : media,
    };
  }

  const text = result.legacy.full_text;
  return { text, urls, media };
};

const insertSubstring = (
  originalString: string,
  index: number,
  substring: string,
) => originalString.slice(0, index) + substring + originalString.slice(index);
