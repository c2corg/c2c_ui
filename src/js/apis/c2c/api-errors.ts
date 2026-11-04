// The errors of a failed request to the c2c API, as the views show them
import {
  type ApiError,
  apiError,
  errorResponse,
  type ValidationError,
  validationError,
  validationErrorResponse,
} from './schemas';

import { checkResponse } from '@/js/apis/check-response';

// the 403 answers of the API, by the permission the request lacks (shown by the
// confirmation windows and the edition forms)
// $gettext('Authentication required', 'API message')
// $gettext('Moderator role required', 'API message')

// the 400 answer of a nonce request (e.g. a password change) for an account whose
// email is not validated (shown by the login forms)
// $gettext('Account not validated yet', 'API message')

// $gettext('An unexpected error occurred, please try again', 'API message')
const unexpected = (): ApiError => ({
  location: 'body',
  name: '',
  description: 'An unexpected error occurred, please try again',
});

// the validation errors of FastAPI, as the texts of the API's own errors, which the UI translates: by the type of the
// error, and the limit of the check (ctx); other types keep FastAPI's text
// $gettext('Required', 'API message')
// $gettext('Shorter than minimum length 1', 'API message')
// $gettext('Shorter than minimum length 3', 'API message')
// $gettext('Longer than maximum length 25', 'API message')
const descriptions: Record<string, (ctx: Record<string, unknown>) => string | undefined> = {
  missing: () => 'Required',
  string_too_short: (ctx) => withLimit('Shorter than minimum length', ctx.min_length),
  too_short: (ctx) => withLimit('Shorter than minimum length', ctx.min_length),
  string_too_long: (ctx) => withLimit('Longer than maximum length', ctx.max_length),
  too_long: (ctx) => withLimit('Longer than maximum length', ctx.max_length),
};

// a text with its limit, none without a limit (FastAPI's text is kept)
function withLimit(text: string, limit: unknown): string | undefined {
  return typeof limit === 'number' ? `${text} ${limit}` : undefined;
}

// FastAPI's locations, as the API's own errors name them
const locations: Record<string, string> = { query: 'querystring' };

/** A validation error of FastAPI, as an error of the API: its field as a dotted path, and a text the UI translates */
function fromValidationError({ loc, msg, type, ctx }: ValidationError): ApiError {
  const [location, ...path] = loc;
  return {
    location: locations[location] ?? String(location),
    name: path.join('.'),
    // own types only: not those of Object.prototype (toString...)
    description: (Object.hasOwn(descriptions, type) ? descriptions[type](ctx ?? {}) : undefined) ?? msg,
  };
}

/**
 * The errors the API gave for a failed request, checked against their schema: its own errors, or the validation errors
 * of FastAPI, given in the same form. A request without an answer of the API (network error, error page of a proxy), or
 * without a valid error, gives one unexpected error, without name: there is always one to show.
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

  const request = `${config?.method?.toUpperCase()} ${config?.url}`;

  // the validation errors of FastAPI (422)
  if ('detail' in data) {
    checkResponse(validationErrorResponse, data, request);
    const { detail } = data as { detail?: unknown };
    const valid = Array.isArray(detail) ? detail.filter((error) => validationError.safeParse(error).success) : [];
    return valid.length ? valid.map(fromValidationError) : [unexpected()];
  }

  checkResponse(errorResponse, data, request);
  // in production, an unexpected answer is only reported (check-response.ts): its valid errors are kept
  const { errors } = data as { errors?: unknown };
  const valid = Array.isArray(errors) ? errors.filter((error) => apiError.safeParse(error).success) : [];
  return valid.length ? valid : [unexpected()];
}

/** The HTTP status of a failed request, if the server answered */
export function errorStatus(error: unknown): number | undefined {
  return (error as { response?: { status?: number } } | undefined)?.response?.status;
}
