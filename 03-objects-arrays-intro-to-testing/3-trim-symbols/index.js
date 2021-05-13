/**
 * trimSymbols - removes consecutive identical symbols if they quantity bigger that size
 * @param {string} string - the initial string
 * @param {number} size - the allowed size of consecutive identical symbols
 * @returns {string} - the new string without extra symbols according passed size
 */
export function trimSymbols(string, size) {
  if (string.length === 0 || size === 0) {
    return '';
  }
  if (size === undefined) {
    return string;
  }

  let currentChar = '';
  let result = '';
  let counter = 0;

  for (const char of string) {
    if (currentChar === char) {
      if (counter < size) {
        counter++;
        result += char;
      }
    } else {
      currentChar = char;
      counter = 1;
      result += char;
    }
  }

  return result;
}
