
/**
 * Function to get data from local storage if it is not expired.
 * @param {string} key - The key to retrieve the data.
 * @returns {string | null} - The data if available and not expired, otherwise null.
 */
export const getFromCache = (key: string): string | null => {
  const cachedItem = localStorage.getItem(key);
  if (cachedItem) {
      const item = JSON.parse(cachedItem);
      const now = new Date().getTime();
      if (item.expiry && now < item.expiry) {
          return item.data;
      }
      localStorage.removeItem(key);
  }
  
  return null;
}

/**
* Function to set data in local storage with an expiration time.
* @param {string} key - The key under which to store the data.
* @param {string} data - The data to store.
* @param {number} ttl - Time to live in seconds.
*/
export const setInCache = (key: string, data: string, ttl: number): void => {
  const now = new Date().getTime();
  const expiry = now + (ttl * 1000);
  const item = {
      data: data,
      expiry: expiry
  };
  localStorage.setItem(key, JSON.stringify(item));
}
