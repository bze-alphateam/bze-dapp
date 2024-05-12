
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
