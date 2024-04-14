export const MAX_CHARACTERS = 120;

export const CHARACTER_ENTITIES_MAP = {
  lt: '<',
  gt: '>',
  amp: '&',
  quot: '"',
  apos: "'",
  cent: '¢',
  pound: '£',
  yen: '¥',
  euro: '€',
  copy: '©',
  reg: '®',
};

// TODO type
export const SPACE: any = {
  type: 'text',
  text: {
    content: ' ',
  },
};

export const NEW_LINE: any = {
  type: 'text',
  text: {
    content: '\n',
  },
};
