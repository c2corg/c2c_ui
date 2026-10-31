// The responses of the c2c API, as the UI reads them: checked when they arrive (check-response.ts), and typed from here
import { z } from 'zod';

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

// the values of an attribute of the documents (common.json, as the API's enums give them)
const attributes = common.attributes as unknown as Record<string, [string, ...string[]]>;
const oneOf = (name: string) => z.enum(attributes[name]);

// a document, as GET /<type>s/:id gives it: its own fields depend on its type, and on its activities or waypoint type
// (the others are left out); the associations and areas are short documents
// a locale of a document, with the fields of its type
const fullLocale = <L extends z.ZodRawShape>(localeFields: L) =>
  locale.extend({
    version: z.number(),
    summary: z.string().nullish(),
    description: z.string().nullish(),
    topic_id: z.number().nullish(),
    ...localeFields,
  });

const fullDocument = <T extends z.ZodRawShape, L extends z.ZodRawShape>(fields: T, localeFields: L) =>
  document.extend({
    type: z.string(),
    version: z.number(),
    quality: oneOf('quality_types'),
    protected: z.boolean(),
    available_langs: z.array(z.string()).nullish(),
    locales: z.array(fullLocale(localeFields)),
    // ?cook=<lang>: the locale in that language (or the best one), its markdown as HTML
    cooked: fullLocale(localeFields).optional(),
    associations: z.record(z.string(), z.union([z.array(document), documentsPage])).optional(),
    areas: z.array(document).optional(),
    maps: z.array(document).optional(),
    ...fields,
  });

// GET /waypoints/:id (v6_api models/waypoint.py)
export const waypoint = fullDocument(
  {
    waypoint_type: oneOf('waypoint_types'),
    elevation: z.number().nullish(),
    elevation_min: z.number().nullish(),
    prominence: z.number().nullish(),
    height_max: z.number().nullish(),
    height_median: z.number().nullish(),
    height_min: z.number().nullish(),
    routes_quantity: z.number().nullish(),
    climbing_outdoor_types: z.array(oneOf('climbing_outdoor_types')).nullish(),
    climbing_indoor_types: z.array(oneOf('climbing_indoor_types')).nullish(),
    climbing_rating_max: oneOf('climbing_ratings').nullish(),
    climbing_rating_min: oneOf('climbing_ratings').nullish(),
    climbing_rating_median: oneOf('climbing_ratings').nullish(),
    equipment_ratings: z.array(oneOf('equipment_ratings')).nullish(),
    climbing_styles: z.array(oneOf('climbing_styles')).nullish(),
    children_proof: oneOf('children_proof_types').nullish(),
    rain_proof: oneOf('rain_proof_types').nullish(),
    orientations: z.array(oneOf('orientation_types')).nullish(),
    best_periods: z.array(oneOf('months')).nullish(),
    product_types: z.array(oneOf('product_types')).nullish(),
    length: z.number().nullish(),
    slope: z.number().nullish(),
    ground_types: z.array(oneOf('ground_types')).nullish(),
    paragliding_rating: oneOf('paragliding_ratings').nullish(),
    exposition_rating: oneOf('exposition_ratings').nullish(),
    rock_types: z.array(oneOf('rock_types')).nullish(),
    weather_station_types: z.array(oneOf('weather_station_types')).nullish(),
    url: z.string().nullish(),
    maps_info: z.string().nullish(),
    phone: z.string().nullish(),
    public_transportation_types: z.array(oneOf('public_transportation_types')).nullish(),
    public_transportation_rating: oneOf('public_transportation_ratings').nullish(),
    snow_clearance_rating: oneOf('snow_clearance_ratings').nullish(),
    lift_access: z.boolean().nullish(),
    parking_fee: oneOf('parking_fee_types').nullish(),
    phone_custodian: z.string().nullish(),
    custodianship: oneOf('custodianship_types').nullish(),
    matress_unstaffed: z.boolean().nullish(),
    blanket_unstaffed: z.boolean().nullish(),
    gas_unstaffed: z.boolean().nullish(),
    heating_unstaffed: z.boolean().nullish(),
    access_time: oneOf('access_times').nullish(),
    capacity: z.number().nullish(),
    capacity_staffed: z.number().nullish(),
    slackline_types: z.array(oneOf('slackline_types')).nullish(),
    slackline_length_min: z.number().nullish(),
    slackline_length_max: z.number().nullish(),
  },
  {
    access: z.string().nullish(),
    access_period: z.string().nullish(),
    external_resources: z.string().nullish(),
  }
);

// GET /routes/:id (v6_api models/route.py)
export const route = fullDocument(
  {
    main_waypoint_id: z.number().nullish(),
    activities: z.array(oneOf('activities')),
    elevation_min: z.number().nullish(),
    elevation_max: z.number().nullish(),
    height_diff_up: z.number().nullish(),
    height_diff_down: z.number().nullish(),
    route_length: z.number().nullish(),
    difficulties_height: z.number().nullish(),
    height_diff_access: z.number().nullish(),
    height_diff_difficulties: z.number().nullish(),
    route_types: z.array(oneOf('route_types')).nullish(),
    orientations: z.array(oneOf('orientation_types')).nullish(),
    durations: z.array(oneOf('route_duration_types')).nullish(),
    calculated_duration: z.number().nullish(),
    glacier_gear: oneOf('glacier_gear_types').nullish(),
    configuration: z.array(oneOf('route_configuration_types')).nullish(),
    lift_access: z.boolean().nullish(),
    ski_rating: oneOf('ski_ratings').nullish(),
    ski_exposition: oneOf('exposition_ratings').nullish(),
    labande_ski_rating: oneOf('labande_ski_ratings').nullish(),
    labande_global_rating: oneOf('global_ratings').nullish(),
    global_rating: oneOf('global_ratings').nullish(),
    engagement_rating: oneOf('engagement_ratings').nullish(),
    risk_rating: oneOf('risk_ratings').nullish(),
    equipment_rating: oneOf('equipment_ratings').nullish(),
    ice_rating: oneOf('ice_ratings').nullish(),
    mixed_rating: oneOf('mixed_ratings').nullish(),
    exposition_rock_rating: oneOf('exposition_rock_ratings').nullish(),
    rock_free_rating: oneOf('climbing_ratings').nullish(),
    rock_required_rating: oneOf('climbing_ratings').nullish(),
    aid_rating: oneOf('aid_ratings').nullish(),
    via_ferrata_rating: oneOf('via_ferrata_ratings').nullish(),
    hiking_rating: oneOf('hiking_ratings').nullish(),
    hiking_mtb_exposition: oneOf('exposition_ratings').nullish(),
    snowshoe_rating: oneOf('snowshoe_ratings').nullish(),
    mtb_up_rating: oneOf('mtb_up_ratings').nullish(),
    mtb_down_rating: oneOf('mtb_down_ratings').nullish(),
    mtb_length_asphalt: z.number().nullish(),
    mtb_length_trail: z.number().nullish(),
    mtb_height_diff_portages: z.number().nullish(),
    rock_types: z.array(oneOf('rock_types')).nullish(),
    climbing_outdoor_type: oneOf('climbing_outdoor_types').nullish(),
    slackline_type: oneOf('slackline_types').nullish(),
    slackline_height: z.number().nullish(),
    // computed from the access waypoints: unknown service without them
    public_transportation_rating: z.enum([...attributes.public_transportation_ratings, 'unknown service']).nullish(),
  },
  {
    title_prefix: z.string().nullish(),
    slope: z.string().nullish(),
    remarks: z.string().nullish(),
    gear: z.string().nullish(),
    external_resources: z.string().nullish(),
    route_history: z.string().nullish(),
    slackline_anchor1: z.string().nullish(),
    slackline_anchor2: z.string().nullish(),
  }
);

// GET /outings/:id (v6_api models/outing.py)
export const outing = fullDocument(
  {
    activities: z.array(oneOf('activities')),
    date_start: z.string(),
    date_end: z.string(),
    frequentation: oneOf('frequentation_types').nullish(),
    participant_count: z.number().nullish(),
    elevation_min: z.number().nullish(),
    elevation_max: z.number().nullish(),
    elevation_access: z.number().nullish(),
    elevation_up_snow: z.number().nullish(),
    elevation_down_snow: z.number().nullish(),
    height_diff_up: z.number().nullish(),
    height_diff_down: z.number().nullish(),
    length_total: z.number().nullish(),
    partial_trip: z.boolean().nullish(),
    public_transport: z.boolean().nullish(),
    access_condition: oneOf('access_conditions').nullish(),
    lift_status: oneOf('lift_status').nullish(),
    condition_rating: oneOf('condition_ratings').nullish(),
    snow_quantity: oneOf('snow_quantity_ratings').nullish(),
    snow_quality: oneOf('snow_quality_ratings').nullish(),
    glacier_rating: oneOf('glacier_ratings').nullish(),
    avalanche_signs: z.array(oneOf('avalanche_signs')).nullish(),
    hut_status: oneOf('hut_status').nullish(),
    disable_comments: z.boolean().nullish(),
    hiking_rating: oneOf('hiking_ratings').nullish(),
    ski_rating: oneOf('ski_ratings').nullish(),
    labande_global_rating: oneOf('global_ratings').nullish(),
    snowshoe_rating: oneOf('snowshoe_ratings').nullish(),
    global_rating: oneOf('global_ratings').nullish(),
    height_diff_difficulties: z.number().nullish(),
    engagement_rating: oneOf('engagement_ratings').nullish(),
    equipment_rating: oneOf('equipment_ratings').nullish(),
    rock_free_rating: oneOf('climbing_ratings').nullish(),
    ice_rating: oneOf('ice_ratings').nullish(),
    via_ferrata_rating: oneOf('via_ferrata_ratings').nullish(),
    mtb_up_rating: oneOf('mtb_up_ratings').nullish(),
    mtb_down_rating: oneOf('mtb_down_ratings').nullish(),
  },
  {
    participants: z.string().nullish(),
    access_comment: z.string().nullish(),
    weather: z.string().nullish(),
    timing: z.string().nullish(),
    conditions_levels: z.string().nullish(),
    conditions: z.string().nullish(),
    avalanches: z.string().nullish(),
    hut_comment: z.string().nullish(),
    route_description: z.string().nullish(),
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
    area_type: oneOf('area_types').nullish(),
  },
  {}
);

// GET /articles/:id (v6_api models/article.py)
export const article = fullDocument(
  {
    categories: z.array(oneOf('article_categories')).nullish(),
    activities: z.array(oneOf('activities')).nullish(),
    article_type: oneOf('article_types').nullish(),
    author: user.nullish(),
  },
  {}
);

// GET /books/:id (v6_api models/book.py)
export const book = fullDocument(
  {
    editor: z.string().nullish(),
    activities: z.array(oneOf('activities')).nullish(),
    url: z.string().nullish(),
    isbn: z.string().nullish(),
    book_types: z.array(oneOf('book_types')).nullish(),
    nb_pages: z.number().nullish(),
    publication_date: z.string().nullish(),
    langs: z.array(z.string()).nullish(),
    author: z.string().nullish(),
  },
  {}
);

// GET /images/:id (v6_api models/image.py)
export const image = fullDocument(
  {
    activities: z.array(oneOf('activities')).nullish(),
    categories: z.array(oneOf('image_categories')).nullish(),
    image_type: oneOf('image_types').nullish(),
    elevation: z.number().nullish(),
    height: z.number().nullish(),
    width: z.number().nullish(),
    file_size: z.number().nullish(),
    date_time: z.string().nullish(),
    camera_name: z.string().nullish(),
    exposure_time: z.number().nullish(),
    focal_length: z.number().nullish(),
    fnumber: z.number().nullish(),
    iso_speed: z.number().nullish(),
    filename: z.string(),
    author: z.string().nullish(),
    creator: user.nullish(),
  },
  {}
);

// GET /maps/:id (v6_api models/topo_map.py): its editors and scales are not in common.json
export const map = fullDocument(
  {
    editor: z.enum(['IGN', 'Swisstopo', 'Escursionista']).nullish(),
    scale: z.enum(['25000', '50000', '100000']).nullish(),
    code: z.string().nullish(),
  },
  {}
);

// GET /profiles/:id (v6_api models/user_profile.py): a private profile, for a visitor, is only its id and name
export const profile = z.union([
  fullDocument(
    {
      activities: z.array(oneOf('activities')).nullish(),
      categories: z.array(oneOf('user_categories')).nullish(),
      name: z.string(),
      forum_username: z.string().nullish(),
    },
    {}
  ),
  z.object({ not_authorized: z.literal(true), document_id: z.number(), name: z.string() }),
]);

// GET /xreports/:id (v6_api models/xreport.py): the personal fields only for its author and the moderators.
// previous_injuries_3 was taken out of the UI's common.json, the API still has it
export const xreport = fullDocument(
  {
    elevation: z.number().nullish(),
    date: z.string().nullish(),
    event_type: oneOf('event_types').nullish(),
    event_activity: oneOf('event_activities'),
    nb_participants: z.number().nullish(),
    nb_impacted: z.number().nullish(),
    rescue: z.boolean().nullish(),
    avalanche_level: oneOf('avalanche_levels').nullish(),
    avalanche_slope: oneOf('avalanche_slopes').nullish(),
    severity: oneOf('severities').nullish(),
    author_status: oneOf('author_statuses').nullish(),
    activity_rate: oneOf('activity_rates').nullish(),
    age: z.number().nullish(),
    gender: oneOf('genders').nullish(),
    previous_injuries: z.enum([...attributes.previous_injuries, 'previous_injuries_3']).nullish(),
    autonomy: oneOf('autonomies').nullish(),
    supervision: oneOf('supervision').nullish(),
    qualification: oneOf('qualification').nullish(),
    disable_comments: z.boolean().nullish(),
    anonymous: z.boolean().nullish(),
    author: user.nullish(),
  },
  {
    place: z.string().nullish(),
    route_study: z.string().nullish(),
    conditions: z.string().nullish(),
    training: z.string().nullish(),
    motivations: z.string().nullish(),
    group_management: z.string().nullish(),
    risk: z.string().nullish(),
    time_management: z.string().nullish(),
    safety: z.string().nullish(),
    reduce_impact: z.string().nullish(),
    increase_impact: z.string().nullish(),
    modifications: z.string().nullish(),
    other_comments: z.string().nullish(),
  }
);

export type Area = z.input<typeof area>;
export type Article = z.input<typeof article>;
export type Book = z.input<typeof book>;
export type Image = z.input<typeof image>;
export type TopoMap = z.input<typeof map>;
export type Profile = z.input<typeof profile>;
export type Xreport = z.input<typeof xreport>;

// the full schema of each document type, by its name in the API urls
export const fullDocuments: Record<string, z.ZodType> = {
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
