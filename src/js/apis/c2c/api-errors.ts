// The errors of a failed request to the c2c API, as the views show them
import { type ApiError, errorResponse } from './schemas';

import { checkResponse } from '@/js/apis/check-response';

// $gettext('An unexpected error occurred, please try again', 'API message')
const unexpected = (): ApiError => ({
  location: 'body',
  name: '',
  description: 'An unexpected error occurred, please try again',
});

/**
 * The errors the API gave for a failed request, checked against their schema. A request without an answer of the API
 * (network error, error page of a proxy) gives one unexpected error, without name: there is always one to show.
 */
export function apiErrors(error: unknown): ApiError[] {
  // a failed request, as axios gives it: its response, if the server answered, and its config
  const { response, config } = (error ?? {}) as {
    response?: { data?: unknown };
    config?: { method?: string; url?: string };
  };
  const data = response?.data;

  if (typeof data !== 'object' || data === null || (data as { status?: unknown }).status !== 'error') {
    return [unexpected()];
  }

  const { errors } = checkResponse(errorResponse, data, `${config?.method?.toUpperCase()} ${config?.url}`);
  // in production, an unexpected answer is only reported (check-response.ts)
  return Array.isArray(errors) && errors.length ? errors : [unexpected()];
}

/** The HTTP status of a failed request, if the server answered */
export function errorStatus(error: unknown): number | undefined {
  return (error as { response?: { status?: number } } | undefined)?.response?.status;
}
