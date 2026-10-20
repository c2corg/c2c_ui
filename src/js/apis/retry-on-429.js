/*
 * Retries a safe (GET, HEAD, OPTIONS) request once after a 429 Too Many Requests, waiting
 * for the delay given by the Retry-After header. Never retries immediately, which would
 * only extend the burst that triggered the rate limit.
 *
 * The header is only readable cross-origin if the response exposes it
 * (Access-Control-Expose-Headers: Retry-After). When it isn't, the delay is read from the
 * body of the rate-limit error page ("... retry after 30 seconds"). Without either, or with
 * a delay longer than MAX_RETRY_DELAY_SECONDS, the error is passed on unchanged.
 */

const MAX_RETRY_DELAY_SECONDS = 30;
const MIN_RETRY_DELAY_SECONDS = 1;

// The interceptor can't tell whether a write was applied before the 429, so writes are never replayed.
const RETRYABLE_METHODS = new Set(['get', 'head', 'options']);

const parseRetryAfter = function (value) {
  if (!value) {
    return null;
  }

  const seconds = Number(value);
  if (Number.isFinite(seconds)) {
    return Math.max(0, seconds);
  }

  // HTTP-date form
  const date = Date.parse(value);
  if (Number.isNaN(date)) {
    return null;
  }
  return Math.max(0, (date - Date.now()) / 1000);
};

const RETRY_AFTER_IN_BODY = /retry after (\d+) seconds?/i;

const parseRetryAfterFromBody = function (data) {
  const text = typeof data === 'string' ? data : JSON.stringify(data ?? '');
  const match = RETRY_AFTER_IN_BODY.exec(text);
  return match ? Number(match[1]) : null;
};

export default function retryOn429(axiosInstance) {
  axiosInstance.interceptors.response.use(undefined, (error) => {
    const { config, response } = error;

    if (
      !config ||
      !response ||
      response.status !== 429 ||
      config.retriedAfter429 ||
      !RETRYABLE_METHODS.has(config.method?.toLowerCase())
    ) {
      return Promise.reject(error);
    }

    const delay = parseRetryAfter(response.headers['retry-after']) ?? parseRetryAfterFromBody(response.data);
    if (delay === null || delay > MAX_RETRY_DELAY_SECONDS) {
      return Promise.reject(error);
    }

    config.retriedAfter429 = true;
    const waitMs = Math.max(delay, MIN_RETRY_DELAY_SECONDS) * 1000;
    return new Promise((resolve) => setTimeout(resolve, waitMs)).then(() => axiosInstance.request(config));
  });

  return axiosInstance;
}
