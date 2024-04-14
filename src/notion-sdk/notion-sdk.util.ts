import { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints';
import { TweetData, TweetMedia } from 'src/twitter/interface';
import { CHARACTER_ENTITIES_MAP, NEW_LINE, SPACE } from './notion-sdk.constant';

export const constructRichText = ({ text, urls, media }: TweetData) => {
  const cleanText = removeSpecialCharacters(removeMediaUrls(media, text));
  let urlSeparators = '\n';
  if (urls.length > 0) {
    urlSeparators = `${urlSeparators}|${urls
      .map((item) => item.url)
      .join('|')}`;
  }
  const urlPattern = new RegExp(`(${urlSeparators})`, 'g'); // Combine URLs and newline with global multiline flags
  const splitText = cleanText.split(urlPattern);

  const result = splitText.map((textSegment, index) => {
    // Even elements are text segments, odd elements are matched URLs or newlines
    if (index % 2 === 0) {
      return constructText(textSegment); // Process plain text
    }

    // Check if it's a newline
    if (textSegment === '\n') {
      return NEW_LINE; // Or modify based on your desired handling
    }

    const url = urls.find((url) => url.url === textSegment);

    return constructText(url.display_url, url.expanded_url);
  });

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
        SPACE,
        {
          type: 'text',
          text: {
            content: '@' + tweet.username,
            link: { url: tweet.url },
          },
        },
        constructText(' — '),
        { mention: constructDate(tweet.date) },
      ],
      children,
    },
  };
};

const addHours = (date: Date, hours: number) => {
  date.setTime(date.getTime() + hours * 60 * 60 * 1000);

  return date;
};

const constructDate = (date: string) => {
  return {
    date: {
      start: addHours(new Date(date), 7).toISOString(),
      time_zone: 'Asia/Bangkok',
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
  ...(url && { annotations: { color: 'blue' } }),
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

  if (stopperIndex === -1) return text;

  const modifiedText = text.substring(0, stopperIndex);

  return modifiedText;
};
