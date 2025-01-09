/**
 * Function to get data from local storage if it is not expired.
 * @param {string} key - The key to retrieve the data.
 * @returns {string | null} - The data if available and not expired, otherwise null.
 */
export const getFromCache = (key: string): string | null => {
    const cachedItem = localStorage.getItem(prefixedKey(key));
    if (cachedItem) {
        const item = JSON.parse(cachedItem);
        const now = new Date().getTime();
        if (item.expiry && now < item.expiry) {
            return item.data;
        }
        localStorage.removeItem(prefixedKey(key));
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
    localStorage.setItem(prefixedKey(key), JSON.stringify(item));
}

export const removeFromCache = (key: string): void => {
    localStorage.removeItem(prefixedKey(key));
}

export const getKeyExpiry = (key: string): Date | null => {
    const cachedItem = localStorage.getItem(prefixedKey(key));
    if (cachedItem) {
        const item = JSON.parse(cachedItem);
        if (item.expiry) {
            return item.expiry;
        }
    }

    return null;
}

export const setKeyExpiry = (key: string, expiry: Date): boolean => {
    const cachedItem = localStorage.getItem(prefixedKey(key));
    if (cachedItem) {
        const item = JSON.parse(cachedItem);
        if (item) {
            item.expiry = expiry;
            localStorage.setItem(prefixedKey(key), JSON.stringify(item));

            return true;
        }
    }

    return false;
}


const prefixedKey = (key: string): string => {
    return `p6:${key}`;
}
