import { TweetData, TweetMedia } from 'src/twitter/interface';

export const constructBlock = ({ text, urls, media }: TweetData) => {
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

const constructText = (text: string, url?: string) => ({
  text: { content: text, ...(url && { link: { url } }) },
});

const removeMediaUrls = (media: TweetMedia[], text: string) => {
  const mediasToRemove = new Set(media.map(({ url }) => url));

  return text
    .split(' ')
    .filter((word) => !mediasToRemove.has(word))
    .join(' ');
};
