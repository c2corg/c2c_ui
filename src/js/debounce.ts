export default function debounce<Args extends unknown[]>(
  func: (this: unknown, ...args: Args) => void,
  wait = 100
): (this: unknown, ...args: Args) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return function (this: unknown, ...args: Args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}
