/**
 * sortStrings - sorts array of string by two criteria "asc" or "desc"
 * @param {string[]} arr - the array of strings
 * @param {string} [param="asc"] param - the sorting type "asc" or "desc"
 * @returns {string[]}
 */
export function sortStrings(arr, param = 'asc') {
  return arr.slice().sort(function(a, b) {
    const result = a.localeCompare(b, ['ru-u-kf-upper', 'en-u-kf-upper']);

    if (param === 'asc') {
      return result;
    } else if (param === 'desc') {
      return -result;
    }
  });
}
