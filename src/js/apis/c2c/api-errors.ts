// The errors of a failed request to the c2c API, as the views show them
import { type ApiError, apiError, errorResponse } from './schemas';

import { checkResponse } from '@/js/apis/check-response';

// $gettext('An unexpected error occurred, please try again', 'API message')
const unexpected = (): ApiError => ({
  location: 'body',
  name: '',
  description: 'An unexpected error occurred, please try again',
});

/**
 * The errors the API gave for a failed request, checked against their schema. A request without an answer of the API
 * (network error, error page of a proxy), or without a valid error, gives one unexpected error, without name: there is
 * always one to show.
 */
export function apiErrors(error: unknown): ApiError[] {
  // a failed request, as axios gives it: its response, if the server answered, and its config
  const { response, config } = (error ?? {}) as {
    response?: { data?: unknown };
    config?: { method?: string; url?: string };
  };
  const data = response?.data;

  // an answer that is not JSON (an error page of a proxy), or no answer
  if (typeof data !== 'object' || data === null) {
    return [unexpected()];
  }

  checkResponse(errorResponse, data, `${config?.method?.toUpperCase()} ${config?.url}`);
  // in production, an unexpected answer is only reported (check-response.ts): its valid errors are kept
  const { errors } = data as { errors?: unknown };
  const valid = Array.isArray(errors) ? errors.filter((error) => apiError.safeParse(error).success) : [];
  return valid.length ? valid : [unexpected()];
}

/** The HTTP status of a failed request, if the server answered */
export function errorStatus(error: unknown): number | undefined {
  return (error as { response?: { status?: number } } | undefined)?.response?.status;
}
