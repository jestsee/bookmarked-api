import { TweetData, TweetMedia, TweetUrl } from './interface';

export const extractTwitterData = (
  twitterResponse: any,
  url: string,
): TweetData => {
  const { result } = twitterResponse;
  const userData = result.core.user_results.result.legacy;

  const urls = (result.legacy.entities.urls ?? []) as TweetUrl[];
  const media = (result.legacy.entities.media ?? []) as TweetMedia[];

  // construct data
  const data: TweetData = {
    name: userData.name,
    username: userData.screen_name,
    avatar: userData.profile_image_url_https,
    text: result.legacy.full_text,
    url,
    urls,
    media,
    ...(result.quoted_status_result && {
      quotedTweet: extractTwitterData(result.quoted_status_result, url),
    }),
  };

  return data;
};
