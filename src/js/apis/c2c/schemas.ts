// The responses of the c2c API, as the UI reads them: checked when they arrive (check-response.ts), and typed from here
import * as z from 'zod/mini';

import common from '@/js/constants/common.json';

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
  // a login for the forum (discourse in the request): where to go back, through the forum SSO
  redirect: z.optional(z.string()),
  redirect_internal: z.optional(z.string()),
});

// the data as the API gives it (check-response.ts): the schema's input type
export type LoginResponse = z.input<typeof loginResponse>;

// a locale of a document; its other properties depend on the document type
const locale = z.object({
  lang: z.string(),
  version: z.optional(z.number()),
  title: z.nullish(z.string()),
  title_prefix: z.nullish(z.string()),
});

// a document, in any answer: only its id is always there (a private profile is { not_authorized, document_id, name })
export const document = z.object({
  document_id: z.number(),
  // the type letter: r (route), w (waypoint), o (outing)...
  type: z.optional(z.string()),
  version: z.optional(z.number()),
  locales: z.optional(z.array(locale)),
  available_langs: z.nullish(z.array(z.string())),
  geometry: z.nullish(z.object({ geom: z.nullish(z.string()), geom_detail: z.nullish(z.string()) })),
  protected: z.optional(z.boolean()),
  areas: z.optional(z.array(z.object({ document_id: z.number() }))),
});

// GET /<type>s: a page of documents
export const documentsPage = z.object({ documents: z.array(document), total: z.number() });

// the values of an attribute of the documents (common.json, as the API's enums give them)
const attributes = common.attributes as unknown as Record<string, [string, ...string[]]>;
const oneOf = (name: string) => z.enum(attributes[name]);

// a document, as GET /<type>s/:id gives it: its own fields depend on its type, and on its activities or waypoint type
// (the others are left out); the associations and areas are short documents
// the associated documents of a full document (v6_api views): lists, and pages for the last outings of a route or a
// waypoint and the routes of a waypoint
const associatedDocuments = z.optional(z.array(document));
export const associations = z.object({
  waypoints: associatedDocuments,
  waypoint_children: associatedDocuments,
  routes: associatedDocuments,
  outings: associatedDocuments,
  images: associatedDocuments,
  articles: associatedDocuments,
  books: associatedDocuments,
  xreports: associatedDocuments,
  users: associatedDocuments,
  areas: associatedDocuments,
  recent_outings: z.optional(documentsPage),
  all_routes: z.optional(documentsPage),
});

// a locale of a document, with the fields of its type
const fullLocale = <L extends z.core.$ZodShape>(localeFields: L) =>
  z.extend(locale, {
    version: z.number(),
    summary: z.nullish(z.string()),
    description: z.nullish(z.string()),
    topic_id: z.nullish(z.number()),
    ...localeFields,
  });

const fullDocument = <T extends z.core.$ZodShape, L extends z.core.$ZodShape>(fields: T, localeFields: L) =>
  z.extend(document, {
    type: z.string(),
    version: z.number(),
    quality: oneOf('quality_types'),
    protected: z.boolean(),
    available_langs: z.nullish(z.array(z.string())),
    locales: z.array(fullLocale(localeFields)),
    // ?cook=<lang>: the locale in that language (or the best one), its markdown as HTML
    cooked: z.optional(fullLocale(localeFields)),
    associations: z.optional(associations),
    // the areas of the document, with their type (range, administrative limits, country)
    areas: z.optional(z.array(z.extend(document, { area_type: z.nullish(z.string()) }))),
    // the maps of the document's area, with their editor and code
    maps: z.optional(z.array(z.extend(document, { editor: z.nullish(z.string()), code: z.nullish(z.string()) }))),
    ...fields,
  });

// GET /waypoints/:id (v6_api models/waypoint.py)
export const waypoint = fullDocument(
  {
    waypoint_type: oneOf('waypoint_types'),
    elevation: z.nullish(z.number()),
    elevation_min: z.nullish(z.number()),
    prominence: z.nullish(z.number()),
    height_max: z.nullish(z.number()),
    height_median: z.nullish(z.number()),
    height_min: z.nullish(z.number()),
    routes_quantity: z.nullish(z.number()),
    climbing_outdoor_types: z.nullish(z.array(oneOf('climbing_outdoor_types'))),
    climbing_indoor_types: z.nullish(z.array(oneOf('climbing_indoor_types'))),
    climbing_rating_max: z.nullish(oneOf('climbing_ratings')),
    climbing_rating_min: z.nullish(oneOf('climbing_ratings')),
    climbing_rating_median: z.nullish(oneOf('climbing_ratings')),
    equipment_ratings: z.nullish(z.array(oneOf('equipment_ratings'))),
    climbing_styles: z.nullish(z.array(oneOf('climbing_styles'))),
    children_proof: z.nullish(oneOf('children_proof_types')),
    rain_proof: z.nullish(oneOf('rain_proof_types')),
    orientations: z.nullish(z.array(oneOf('orientation_types'))),
    best_periods: z.nullish(z.array(oneOf('months'))),
    product_types: z.nullish(z.array(oneOf('product_types'))),
    length: z.nullish(z.number()),
    slope: z.nullish(z.number()),
    ground_types: z.nullish(z.array(oneOf('ground_types'))),
    paragliding_rating: z.nullish(oneOf('paragliding_ratings')),
    exposition_rating: z.nullish(oneOf('exposition_ratings')),
    rock_types: z.nullish(z.array(oneOf('rock_types'))),
    weather_station_types: z.nullish(z.array(oneOf('weather_station_types'))),
    url: z.nullish(z.string()),
    maps_info: z.nullish(z.string()),
    phone: z.nullish(z.string()),
    public_transportation_types: z.nullish(z.array(oneOf('public_transportation_types'))),
    public_transportation_rating: z.nullish(oneOf('public_transportation_ratings')),
    snow_clearance_rating: z.nullish(oneOf('snow_clearance_ratings')),
    lift_access: z.nullish(z.boolean()),
    parking_fee: z.nullish(oneOf('parking_fee_types')),
    phone_custodian: z.nullish(z.string()),
    custodianship: z.nullish(oneOf('custodianship_types')),
    matress_unstaffed: z.nullish(z.boolean()),
    blanket_unstaffed: z.nullish(z.boolean()),
    gas_unstaffed: z.nullish(z.boolean()),
    heating_unstaffed: z.nullish(z.boolean()),
    access_time: z.nullish(oneOf('access_times')),
    capacity: z.nullish(z.number()),
    capacity_staffed: z.nullish(z.number()),
    slackline_types: z.nullish(z.array(oneOf('slackline_types'))),
    slackline_length_min: z.nullish(z.number()),
    slackline_length_max: z.nullish(z.number()),
  },
  {
    access: z.nullish(z.string()),
    access_period: z.nullish(z.string()),
    external_resources: z.nullish(z.string()),
  }
);

// GET /routes/:id (v6_api models/route.py)
export const route = fullDocument(
  {
    main_waypoint_id: z.nullish(z.number()),
    activities: z.array(oneOf('activities')),
    elevation_min: z.nullish(z.number()),
    elevation_max: z.nullish(z.number()),
    height_diff_up: z.nullish(z.number()),
    height_diff_down: z.nullish(z.number()),
    route_length: z.nullish(z.number()),
    difficulties_height: z.nullish(z.number()),
    height_diff_access: z.nullish(z.number()),
    height_diff_difficulties: z.nullish(z.number()),
    route_types: z.nullish(z.array(oneOf('route_types'))),
    orientations: z.nullish(z.array(oneOf('orientation_types'))),
    durations: z.nullish(z.array(oneOf('route_duration_types'))),
    calculated_duration: z.nullish(z.number()),
    glacier_gear: z.nullish(oneOf('glacier_gear_types')),
    configuration: z.nullish(z.array(oneOf('route_configuration_types'))),
    lift_access: z.nullish(z.boolean()),
    ski_rating: z.nullish(oneOf('ski_ratings')),
    ski_exposition: z.nullish(oneOf('exposition_ratings')),
    labande_ski_rating: z.nullish(oneOf('labande_ski_ratings')),
    labande_global_rating: z.nullish(oneOf('global_ratings')),
    global_rating: z.nullish(oneOf('global_ratings')),
    engagement_rating: z.nullish(oneOf('engagement_ratings')),
    risk_rating: z.nullish(oneOf('risk_ratings')),
    equipment_rating: z.nullish(oneOf('equipment_ratings')),
    ice_rating: z.nullish(oneOf('ice_ratings')),
    mixed_rating: z.nullish(oneOf('mixed_ratings')),
    exposition_rock_rating: z.nullish(oneOf('exposition_rock_ratings')),
    rock_free_rating: z.nullish(oneOf('climbing_ratings')),
    rock_required_rating: z.nullish(oneOf('climbing_ratings')),
    aid_rating: z.nullish(oneOf('aid_ratings')),
    via_ferrata_rating: z.nullish(oneOf('via_ferrata_ratings')),
    hiking_rating: z.nullish(oneOf('hiking_ratings')),
    hiking_mtb_exposition: z.nullish(oneOf('exposition_ratings')),
    snowshoe_rating: z.nullish(oneOf('snowshoe_ratings')),
    mtb_up_rating: z.nullish(oneOf('mtb_up_ratings')),
    mtb_down_rating: z.nullish(oneOf('mtb_down_ratings')),
    mtb_length_asphalt: z.nullish(z.number()),
    mtb_length_trail: z.nullish(z.number()),
    mtb_height_diff_portages: z.nullish(z.number()),
    rock_types: z.nullish(z.array(oneOf('rock_types'))),
    climbing_outdoor_type: z.nullish(oneOf('climbing_outdoor_types')),
    slackline_type: z.nullish(oneOf('slackline_types')),
    slackline_height: z.nullish(z.number()),
    // computed from the access waypoints: unknown service without them
    public_transportation_rating: z.nullish(z.enum([...attributes.public_transportation_ratings, 'unknown service'])),
  },
  {
    title_prefix: z.nullish(z.string()),
    slope: z.nullish(z.string()),
    remarks: z.nullish(z.string()),
    gear: z.nullish(z.string()),
    external_resources: z.nullish(z.string()),
    route_history: z.nullish(z.string()),
    slackline_anchor1: z.nullish(z.string()),
    slackline_anchor2: z.nullish(z.string()),
  }
);

// GET /outings/:id (v6_api models/outing.py)
export const outing = fullDocument(
  {
    activities: z.array(oneOf('activities')),
    date_start: z.string(),
    date_end: z.string(),
    frequentation: z.nullish(oneOf('frequentation_types')),
    participant_count: z.nullish(z.number()),
    elevation_min: z.nullish(z.number()),
    elevation_max: z.nullish(z.number()),
    elevation_access: z.nullish(z.number()),
    elevation_up_snow: z.nullish(z.number()),
    elevation_down_snow: z.nullish(z.number()),
    height_diff_up: z.nullish(z.number()),
    height_diff_down: z.nullish(z.number()),
    length_total: z.nullish(z.number()),
    partial_trip: z.nullish(z.boolean()),
    public_transport: z.nullish(z.boolean()),
    access_condition: z.nullish(oneOf('access_conditions')),
    lift_status: z.nullish(oneOf('lift_status')),
    condition_rating: z.nullish(oneOf('condition_ratings')),
    snow_quantity: z.nullish(oneOf('snow_quantity_ratings')),
    snow_quality: z.nullish(oneOf('snow_quality_ratings')),
    glacier_rating: z.nullish(oneOf('glacier_ratings')),
    avalanche_signs: z.nullish(z.array(oneOf('avalanche_signs'))),
    hut_status: z.nullish(oneOf('hut_status')),
    disable_comments: z.nullish(z.boolean()),
    hiking_rating: z.nullish(oneOf('hiking_ratings')),
    ski_rating: z.nullish(oneOf('ski_ratings')),
    labande_global_rating: z.nullish(oneOf('global_ratings')),
    snowshoe_rating: z.nullish(oneOf('snowshoe_ratings')),
    global_rating: z.nullish(oneOf('global_ratings')),
    height_diff_difficulties: z.nullish(z.number()),
    engagement_rating: z.nullish(oneOf('engagement_ratings')),
    equipment_rating: z.nullish(oneOf('equipment_ratings')),
    rock_free_rating: z.nullish(oneOf('climbing_ratings')),
    ice_rating: z.nullish(oneOf('ice_ratings')),
    via_ferrata_rating: z.nullish(oneOf('via_ferrata_ratings')),
    mtb_up_rating: z.nullish(oneOf('mtb_up_ratings')),
    mtb_down_rating: z.nullish(oneOf('mtb_down_ratings')),
  },
  {
    participants: z.nullish(z.string()),
    access_comment: z.nullish(z.string()),
    weather: z.nullish(z.string()),
    timing: z.nullish(z.string()),
    conditions_levels: z.nullish(z.string()),
    conditions: z.nullish(z.string()),
    avalanches: z.nullish(z.string()),
    hut_comment: z.nullish(z.string()),
    route_description: z.nullish(z.string()),
  }
);

export type Waypoint = z.input<typeof waypoint>;
export type Route = z.input<typeof route>;
export type Outing = z.input<typeof outing>;

// a user, as the author of an article or an xreport, or the creator of an image
const user = z.object({ user_id: z.number(), name: z.string() });

// GET /areas/:id (v6_api models/area.py)
export const area = fullDocument(
  {
    area_type: z.nullish(oneOf('area_types')),
  },
  {}
);

// GET /articles/:id (v6_api models/article.py)
export const article = fullDocument(
  {
    categories: z.nullish(z.array(oneOf('article_categories'))),
    activities: z.nullish(z.array(oneOf('activities'))),
    article_type: z.nullish(oneOf('article_types')),
    author: z.nullish(user),
  },
  {}
);

// GET /books/:id (v6_api models/book.py)
export const book = fullDocument(
  {
    editor: z.nullish(z.string()),
    activities: z.nullish(z.array(oneOf('activities'))),
    url: z.nullish(z.string()),
    isbn: z.nullish(z.string()),
    book_types: z.nullish(z.array(oneOf('book_types'))),
    nb_pages: z.nullish(z.number()),
    publication_date: z.nullish(z.string()),
    langs: z.nullish(z.array(z.string())),
    author: z.nullish(z.string()),
  },
  {}
);

// GET /images/:id (v6_api models/image.py)
export const image = fullDocument(
  {
    activities: z.nullish(z.array(oneOf('activities'))),
    categories: z.nullish(z.array(oneOf('image_categories'))),
    image_type: z.nullish(oneOf('image_types')),
    elevation: z.nullish(z.number()),
    height: z.nullish(z.number()),
    width: z.nullish(z.number()),
    file_size: z.nullish(z.number()),
    date_time: z.nullish(z.string()),
    camera_name: z.nullish(z.string()),
    exposure_time: z.nullish(z.number()),
    focal_length: z.nullish(z.number()),
    fnumber: z.nullish(z.number()),
    iso_speed: z.nullish(z.number()),
    filename: z.string(),
    author: z.nullish(z.string()),
    creator: z.nullish(user),
  },
  {}
);

// GET /maps/:id (v6_api models/topo_map.py): its editors and scales are not in common.json
export const map = fullDocument(
  {
    editor: z.nullish(z.enum(['IGN', 'Swisstopo', 'Escursionista'])),
    scale: z.nullish(z.enum(['25000', '50000', '100000'])),
    code: z.nullish(z.string()),
  },
  {}
);

// GET /profiles/:id (v6_api models/user_profile.py): a private profile, for a visitor, is only its id and name
export const profile = z.union([
  fullDocument(
    {
      activities: z.nullish(z.array(oneOf('activities'))),
      categories: z.nullish(z.array(oneOf('user_categories'))),
      name: z.string(),
      forum_username: z.nullish(z.string()),
    },
    {}
  ),
  z.object({ not_authorized: z.literal(true), document_id: z.number(), name: z.string() }),
]);

// GET /xreports/:id (v6_api models/xreport.py): the personal fields only for its author and the moderators.
// previous_injuries_3 was taken out of the UI's common.json, the API still has it
export const xreport = fullDocument(
  {
    elevation: z.nullish(z.number()),
    date: z.nullish(z.string()),
    event_type: z.nullish(oneOf('event_types')),
    event_activity: oneOf('event_activities'),
    nb_participants: z.nullish(z.number()),
    nb_impacted: z.nullish(z.number()),
    rescue: z.nullish(z.boolean()),
    avalanche_level: z.nullish(oneOf('avalanche_levels')),
    avalanche_slope: z.nullish(oneOf('avalanche_slopes')),
    severity: z.nullish(oneOf('severities')),
    author_status: z.nullish(oneOf('author_statuses')),
    activity_rate: z.nullish(oneOf('activity_rates')),
    age: z.nullish(z.number()),
    gender: z.nullish(oneOf('genders')),
    previous_injuries: z.nullish(z.enum([...attributes.previous_injuries, 'previous_injuries_3'])),
    autonomy: z.nullish(oneOf('autonomies')),
    supervision: z.nullish(oneOf('supervision')),
    qualification: z.nullish(oneOf('qualification')),
    disable_comments: z.nullish(z.boolean()),
    anonymous: z.nullish(z.boolean()),
    author: z.nullish(user),
  },
  {
    place: z.nullish(z.string()),
    route_study: z.nullish(z.string()),
    conditions: z.nullish(z.string()),
    training: z.nullish(z.string()),
    motivations: z.nullish(z.string()),
    group_management: z.nullish(z.string()),
    risk: z.nullish(z.string()),
    time_management: z.nullish(z.string()),
    safety: z.nullish(z.string()),
    reduce_impact: z.nullish(z.string()),
    increase_impact: z.nullish(z.string()),
    modifications: z.nullish(z.string()),
    other_comments: z.nullish(z.string()),
  }
);

export type Area = z.input<typeof area>;
export type Article = z.input<typeof article>;
export type Book = z.input<typeof book>;
export type Image = z.input<typeof image>;
export type TopoMap = z.input<typeof map>;
export type Profile = z.input<typeof profile>;
export type Xreport = z.input<typeof xreport>;

// GET /<type>s/:id of a merged document: only the document it was merged into (v6_api views/document.py)
export const redirection = z.object({ redirects_to: z.number(), available_langs: z.nullish(z.array(z.string())) });

// the full schema of each document type, by its name in the API urls
export const fullDocuments: Record<string, z.ZodMiniType> = {
  area,
  article,
  book,
  image,
  map,
  outing,
  profile,
  route,
  waypoint,
  xreport,
};

// GET /outings/map/heatmap, /routes/map/heatmap: the density of the documents, in buckets (EPSG:3857)
export const densityHeatmap = z.object({
  buckets: z.array(z.object({ x: z.number(), y: z.number(), count: z.number() })),
});

// GET /outings/map/tracks, /routes/map/tracks: the tracks (GeoJSON) in a box, none if there are too many of them
// (with the activities, the dates of an outing and the ratings that are set: the fields of the documents listing)
export const densityTrack = z.looseObject({
  document_id: z.number(),
  type: z.string(),
  title: z.nullish(z.string()),
  geometry: z.object({ geom_detail: z.string() }),
  activities: z.optional(z.array(z.string())),
  date_start: z.optional(z.string()),
  date_end: z.optional(z.string()),
});
export const densityTracks = z.object({
  documents: z.array(densityTrack),
  truncated: z.boolean(),
  // when there are too many tracks, how many (when the API knows), and whether there are even more
  count: z.optional(z.number()),
  count_capped: z.optional(z.boolean()),
});

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
  pagination_token: z.optional(z.string()),
});

// GET /documents/changes: the recent changes; the last page has no pagination token
export const documentChanges = z.object({
  feed: z.array(
    z.object({
      written_at: z.string(),
      lang: z.string(),
      version_id: z.number(),
      comment: z.nullable(z.string()),
      document: z.object({ document_id: z.number(), type: z.string(), title: z.nullish(z.string()) }),
      user: z.object({ user_id: z.number(), name: z.string() }),
    })
  ),
  pagination_token: z.optional(z.string()),
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

// an error of a validation answer of FastAPI: { loc: ['body', 'locales', 0, 'title'], msg: 'Field required',
// type: 'missing' }, with the limits of the check in ctx ({ max_length: 25 })
export const validationError = z.object({
  loc: z.array(z.union([z.string(), z.number()])),
  msg: z.string(),
  type: z.string(),
  ctx: z.optional(z.record(z.string(), z.unknown())),
});

export type ValidationError = z.input<typeof validationError>;

// the 422 answer of invalid parameters or body: { detail: [...] } (FastAPI, see v6_api#2546)
export const validationErrorResponse = z.object({ detail: z.array(validationError) });
