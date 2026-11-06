// How the service worker (service-worker.ts) answers a page or a saved document: the network first; the copy when
// there is none, or when it is slow (a mountain network), the network's answer then kept for the next time
export const NETWORK_TIMEOUT_MS = 4000;

/**
 * Copy: the copy kept, if any. keep: keeps what the network answered. A storage that fails (full, cleared...) is no
 * copy, never an error: the answer of the server is returned whether it could be kept or not.
 */
export async function networkFirst(
  request: Request,
  copy: () => Promise<Response | undefined>,
  keep: (response: Response) => Promise<unknown>
): Promise<Response> {
  const kept = () => copy().catch(() => undefined);
  const network = fetch(request).then((response) => {
    if (response.ok) {
      // on the side: a quota error would turn an answer of the server into a network error
      keep(response.clone()).catch(() => {});
    }
    return response;
  });
  const slow = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT_MS)).then(
    async () => (await kept()) ?? network
  );
  try {
    return await Promise.race([network, slow]);
  } catch {
    // no network: the copy, else the browser's own error
    return (await kept()) ?? Response.error();
  }
}
