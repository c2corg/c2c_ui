// ZingTouch ships no types: what ImageViewer uses of it
declare module 'zingtouch' {
  type GestureEvent = CustomEvent<{ data: { currentDirection: number }[] }>;

  interface Region {
    bind(element: Element, gesture: string, handler: (event: GestureEvent) => void): void;
    unbind(element: Element, gesture?: string): void;
  }

  const ZingTouch: { Region: new (element: Element) => Region };
  export default ZingTouch;
}
