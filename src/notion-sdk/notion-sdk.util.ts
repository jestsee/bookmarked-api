import { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints';
import { TweetData, TweetMedia } from 'src/twitter/interface';
import { CHARACTER_ENTITIES_MAP } from './notion-sdk.constant';

export const constructRichText = ({ text, urls, media }: TweetData) => {
  const result = [];
  let lastIndex = 0;

  const cleanText = removeSpecialCharacters(removeMediaUrls(media, text));

  urls.forEach((item) => {
    const pattern = new RegExp(`(${item.url})`, 'g');
    let match: RegExpExecArray;

    while ((match = pattern.exec(cleanText)) !== null) {
      // Add the text before the match as a separate object
      if (match.index > lastIndex) {
        result.push(constructText(cleanText.substring(lastIndex, match.index)));
      }

      // Add the matched text with the link
      result.push(constructText(item.display_url, item.expanded_url));

      // Update the lastIndex to the end of the matched text
      lastIndex = match.index + match[0].length;
    }
  });

  // Add the remaining text after the last match
  if (lastIndex < cleanText.length) {
    result.push(constructText(cleanText.substring(lastIndex)));
  }
  return result;
};

export const constructCallout = (tweet: TweetData): BlockObjectRequest => {
  const children = [
    ...constructCalloutContent(tweet),
    ...tweet.media.map(({ media_url_https: url }) => constructImage(url)),
    ...tweet.urls.map(({ expanded_url: url }) => constructBookmark(url)),
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
            content: ' @' + tweet.username,
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

export const constructBookmark = (url: string) => ({
  bookmark: { url },
});

const removeMediaUrls = (media: TweetMedia[], text: string) => {
  const mediasToRemove = new Set(media.map(({ url }) => url));

  return text
    .split(' ')
    .filter((word) => !mediasToRemove.has(word))
    .join(' ');
};

const removeSpecialCharacters = (text: string): string => {
  const pattern = new RegExp(
    `&(${Object.keys(CHARACTER_ENTITIES_MAP).join('|')});`,
    'g',
  );

  return text.replace(pattern, (_, entity) => CHARACTER_ENTITIES_MAP[entity]);
};

export const trimTitleText = (text: string): string => {
  const stopperIndex = text.indexOf('\n');
  const modifiedText = text.substring(0, stopperIndex);

  // if (modifiedText.length > MAX_CHARACTERS) {
  //   return modifiedText.substring(0, MAX_CHARACTERS) + '...';
  // }

  return modifiedText;
};
