/**
 * createGetter - creates function getter which allows select value from object
 * @param {string} path - the strings path separated by dot
 * @returns {function} - function-getter which allow get value from object by set path
 */
export function createGetter(path) {
  return obj => {
    const arrKeys = path.split('.');
    let result = obj[arrKeys[0]];

    function isObject(value) {
      return typeof value === 'object' && value !== null;
    }

    for (let i = 1; i < arrKeys.length && isObject(result); i++) {
      result = result[arrKeys[i]];
    }

    return result;
  };
}
