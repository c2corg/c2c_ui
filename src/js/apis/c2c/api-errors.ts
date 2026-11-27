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

/**
 * An error of the API as the views show it: its text, which the UI translates, and the limit of the check, if any,
 * shown after it (see errorText): one translation for all the limits
 */
export type ShownApiError = ApiError & { limit?: number };

type Description = { description: string; limit?: number };

// the texts with a limit, which the UI translates without the limit
// $gettext('Required', 'API message')
// $gettext('Shorter than minimum length', 'API message')
// $gettext('Longer than maximum length', 'API message')
// $gettext('Less than minimum value', 'API message')
// $gettext('Greater than maximum value', 'API message')
const limitedTexts = [
  'Shorter than minimum length',
  'Longer than maximum length',
  'Less than minimum value',
  'Greater than maximum value',
];
const limitedText = new RegExp(`^(${limitedTexts.join('|')}) (-?\\d+)$`);

// the validation errors of FastAPI, as the texts of the API's own errors, which the UI translates: by the type of the
// error, and the limit of the check (ctx); other types keep FastAPI's text
const descriptions: Record<string, (ctx: Record<string, unknown>) => Description | undefined> = {
  missing: () => ({ description: 'Required' }),
  string_too_short: (ctx) => withLimit('Shorter than minimum length', ctx.min_length),
  too_short: (ctx) => withLimit('Shorter than minimum length', ctx.min_length),
  string_too_long: (ctx) => withLimit('Longer than maximum length', ctx.max_length),
  too_long: (ctx) => withLimit('Longer than maximum length', ctx.max_length),
  greater_than_equal: (ctx) => withLimit('Less than minimum value', ctx.ge),
  less_than_equal: (ctx) => withLimit('Greater than maximum value', ctx.le),
};

// a text with its limit, none without a limit (FastAPI's text is kept)
function withLimit(description: string, limit: unknown): Description | undefined {
  return typeof limit === 'number' ? { description, limit } : undefined;
}

// a text of the API with its limit in it ("Longer than maximum length 150"), as the text and the limit
function splitLimit(error: ApiError): ShownApiError {
  const match = limitedText.exec(error.description);
  return match ? { ...error, description: match[1], limit: Number(match[2]) } : error;
}

/** The text of an error, translated in its context ('API message' for an error of the API), followed by its limit */
export function errorText(
  error: { description: string; limit?: number },
  gettext: (text: string, context?: string) => string,
  context: string | undefined
): string {
  const text = gettext(error.description, context);
  return error.limit === undefined ? text : `${text} ${error.limit}`;
}

// FastAPI's locations, as the API's own errors name them
const locations: Record<string, string> = { query: 'querystring' };

/** A validation error of FastAPI, as an error of the API: its field as a dotted path, and a text the UI translates */
function fromValidationError({ loc, msg, type, ctx }: ValidationError): ShownApiError {
  const [location, ...path] = loc;
  // own types only: not those of Object.prototype (toString...)
  const described = Object.hasOwn(descriptions, type) ? descriptions[type](ctx ?? {}) : undefined;
  return splitLimit({
    location: locations[location] ?? String(location),
    name: path.join('.'),
    description: msg,
    ...described,
  });
}

/**
 * The errors the API gave for a failed request, checked against their schema: its own errors, or the validation errors
 * of FastAPI, given in the same form. A request without an answer of the API (network error, error page of a proxy), or
 * without a valid error, gives one unexpected error, without name: there is always one to show.
 */
export function apiErrors(error: unknown): ShownApiError[] {
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
  return valid.length ? valid.map(splitLimit) : [unexpected()];
}

/** The HTTP status of a failed request, if the server answered */
export function errorStatus(error: unknown): number | undefined {
  return (error as { response?: { status?: number } } | undefined)?.response?.status;
}
