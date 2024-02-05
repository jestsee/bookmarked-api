import { TweetUrl } from 'src/twitter/interface';

export const constructBlock = (text: string, urls: TweetUrl[]) => {
  const result = [];
  let lastIndex = 0;

  urls.forEach((item) => {
    const pattern = new RegExp(`(${item.url})`, 'g');
    let match: RegExpExecArray;

    while ((match = pattern.exec(text)) !== null) {
      // Add the text before the match as a separate object
      if (match.index > lastIndex) {
        result.push(constructText(text.substring(lastIndex, match.index)));
      }

      // Add the matched text with the link
      result.push(constructText(item.display_url, item.expanded_url));

      // Update the lastIndex to the end of the matched text
      lastIndex = match.index + match[0].length;
    }
  });

  // Add the remaining text after the last match
  if (lastIndex < text.length) {
    result.push(constructText(text.substring(lastIndex)));
  }
  return result;
};

const constructText = (text: string, url?: string) => ({
  text: { content: text, ...(url && { link: { url } }) },
});
