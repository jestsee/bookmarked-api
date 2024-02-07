import { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints';
import { TweetData, TweetMedia } from 'src/twitter/interface';

export const constructRichText = ({ text, urls, media }: TweetData) => {
  const result = [];
  let lastIndex = 0;

  const textWithoutMediaUrl = removeMediaUrls(media, text);

  urls.forEach((item) => {
    const pattern = new RegExp(`(${item.url})`, 'g');
    let match: RegExpExecArray;

    while ((match = pattern.exec(textWithoutMediaUrl)) !== null) {
      // Add the text before the match as a separate object
      if (match.index > lastIndex) {
        result.push(
          constructText(textWithoutMediaUrl.substring(lastIndex, match.index)),
        );
      }

      // Add the matched text with the link
      result.push(constructText(item.display_url, item.expanded_url));

      // Update the lastIndex to the end of the matched text
      lastIndex = match.index + match[0].length;
    }
  });

  // Add the remaining text after the last match
  if (lastIndex < textWithoutMediaUrl.length) {
    result.push(constructText(textWithoutMediaUrl.substring(lastIndex)));
  }
  return result;
};

export const constructCallout = (tweet: TweetData): BlockObjectRequest => {
  const children = [
    ...constructCalloutContent(tweet),
    // media
    ...tweet.media.map(({ media_url_https: url }) => constructImage(url)),
  ];

  // quoted tweet
  if (tweet.quotedTweet) {
    children.push(constructCallout(tweet.quotedTweet) as any);
  }

  return {
    callout: {
      icon: {
        type: 'external',
        external: {
          url: tweet.avatar,
        },
      },
      color: 'default',
      rich_text: [
        {
          type: 'text',
          text: {
            content: tweet.name,
          },
          annotations: {
            bold: true,
          },
        },
        {
          type: 'text',
          text: {
            content: '@' + tweet.username,
            link: { url: tweet.url },
          },
        },
      ],
      children,
    },
  };
};

export const constructCalloutContent = (tweet: TweetData) => {
  if (!tweet.inlineMedia || tweet.inlineMedia.length === 0) {
    return [constructParagraph(tweet)];
  }

  const { text } = tweet;
  const result = [];
  let lastIndex = 0;

  tweet.inlineMedia.forEach((item) => {
    const pattern = new RegExp(`(${item})`, 'g');
    let match: RegExpExecArray;

    while ((match = pattern.exec(text)) !== null) {
      // Add the text before the match as a separate object
      if (match.index > lastIndex) {
        result.push(
          constructParagraph({
            ...tweet,
            text: text.substring(lastIndex, match.index),
          }),
        );
      }

      // insert the matched photo
      result.push(constructImage(item));

      // Update the lastIndex to the end of the matched text
      lastIndex = match.index + match[0].length;
    }
  });

  // Add the remaining text after the last match
  if (lastIndex < text.length) {
    result.push(
      constructParagraph({
        ...tweet,
        text: text.substring(lastIndex),
      }),
    );
  }
  return result;
};

export const constructText = (text: string, url?: string) => ({
  text: { content: text, ...(url && { link: { url } }) },
});

export const constructParagraph = (tweet: TweetData) => ({
  paragraph: { rich_text: constructRichText(tweet) },
});

export const constructImage = (url: string) => ({
  image: { external: { url } },
});

const removeMediaUrls = (media: TweetMedia[], text: string) => {
  const mediasToRemove = new Set(media.map(({ url }) => url));

  return text
    .split(' ')
    .filter((word) => !mediasToRemove.has(word))
    .join(' ');
};
