// The responses of the c2c API, as the UI reads them: checked when they arrive (check-response.ts), and typed from here
import { z } from 'zod';

// POST /users/login
export const loginResponse = z.object({
  token: z.string(),
  // token expiration, in seconds since the epoch
  expire: z.number(),
  id: z.number(),
  username: z.string(),
  name: z.string(),
  forum_username: z.string(),
  lang: z.string(),
  roles: z.array(z.string()),
});

// the data as the API gives it (check-response.ts): the schema's input type
export type LoginResponse = z.input<typeof loginResponse>;

// a locale of a document; its other properties depend on the document type
const locale = z.object({
  lang: z.string(),
  version: z.number().optional(),
  title: z.string().nullish(),
  title_prefix: z.string().nullish(),
});

// a document, in any answer: only its id is always there (a private profile is { not_authorized, document_id, name })
export const document = z.object({
  document_id: z.number(),
  // the type letter: r (route), w (waypoint), o (outing)...
  type: z.string().optional(),
  version: z.number().optional(),
  locales: z.array(locale).optional(),
  available_langs: z.array(z.string()).nullish(),
  geometry: z.object({ geom: z.string().nullish(), geom_detail: z.string().nullish() }).nullish(),
  protected: z.boolean().optional(),
  areas: z.array(z.object({ document_id: z.number() })).optional(),
});

// GET /<type>s: a page of documents
export const documentsPage = z.object({ documents: z.array(document), total: z.number() });

// GET /search: a page per document type (routes, waypoints...)
export const searchResults = z.record(z.string(), documentsPage);

// GET /feed, /personal-feed, /profile-feed: the last page has no pagination token
export const feed = z.object({
  feed: z.array(
    z.object({
      id: z.number(),
      time: z.string(),
      change_type: z.string(),
      document,
      user: document,
      participants: z.array(document),
    })
  ),
  pagination_token: z.string().optional(),
});

// GET /documents/changes: the recent changes; the last page has no pagination token
export const documentChanges = z.object({
  feed: z.array(
    z.object({
      written_at: z.string(),
      lang: z.string(),
      version_id: z.number(),
      comment: z.string().nullable(),
      document: z.object({ document_id: z.number(), type: z.string(), title: z.string().nullish() }),
      user: z.object({ user_id: z.number(), name: z.string() }),
    })
  ),
  pagination_token: z.string().optional(),
});

// GET /users/account
export const account = z.object({
  email: z.string(),
  name: z.string(),
  forum_username: z.string(),
  is_profile_public: z.boolean(),
});

// an error of an error answer
export const apiError = z.object({
  // where the error is: body, querystring, url...
  location: z.string(),
  // the field in error (locales.0.title, associations.waypoints...), or a short label
  name: z.string(),
  description: z.string(),
});

export type ApiError = z.input<typeof apiError>;

// an error answer, of any request: { status: 'error', errors: [{ location, name, description }] } (v6_api web/errors.py)
export const errorResponse = z.object({ status: z.literal('error'), errors: z.array(apiError) });
