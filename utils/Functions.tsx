let debounces: Map<string, NodeJS.Timeout> = new Map();
const MAX_DENOM_LEN = 16;

export async function addMultipleDebounce(name: string, delay: number, callback: () => void, times: number): Promise<void> {
    for (let index = 1; index <= times; index++) {
        addDebounce(`${name}-${index}`, delay * index, callback);
    }
}

export async function addDebounce(name: string, delay: number, callback: () => void): Promise<void> {
    cancelDebounce(name);
    const newTimer = setTimeout(() => {
        callback();
    }, delay);

    debounces.set(name, newTimer);
}

export async function cancelDebounce(name: string): Promise<void> {
    let timer = debounces.get(name);
    if (timer) {
        clearTimeout(timer);
        debounces.delete(name);
    }
}

export function getLastCharsAfterSlash(input: string): string {
    const lastSlashIndex = input.lastIndexOf('/');
    if (lastSlashIndex === -1) {
        return input;  // Return the original string if no '/' found
    }
    return input.substring(lastSlashIndex + 1);
}

export function stringTruncateFromCenter(str: string, maxLength: number) {
    const midChar = '…'; // character to insert into the center of the result

    if (str.length <= maxLength) return str;

    // length of beginning part
    const left = Math.ceil(maxLength / 2);

    // start index of ending part
    const right = str.length - Math.floor(maxLength / 2) + 1;

    return str.substring(0, left) + midChar + str.substring(right);
}

export function truncateDenom(denom: string) {
    return stringTruncateFromCenter(denom, MAX_DENOM_LEN);
}

// Utility function to decode Base64
export function decodeBase64(str: string): string {
    return Buffer.from(str, 'base64').toString('utf-8');
}

export function snakeToCamel(snake: string): string {
    return snake.replace(/(_\w)/g, (matches) => matches[1].toUpperCase());
}

export function toUpperFirstLetter(str: string): string {
    if (str.length === 0) {
        return str;
    }

    return str.charAt(0).toUpperCase() + str.slice(1);
}

export async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
