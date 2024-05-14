
let debounces: Map<string, NodeJS.Timeout> = new Map();

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
