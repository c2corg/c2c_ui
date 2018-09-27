import requests
import json

URL = 'https://raw.githubusercontent.com/c2corg/v6_common/master/c2corg_common/{}.py'.format


def get_fields(name):
    exec(requests.get(URL(name)).text)
    return dict(locals())


result = {}

# result["fields"] = {}
# result["fields"]["area"] = get_fields('fields_area')['fields_area']
# result["fields"]["article"] = get_fields('fields_article')['fields_article']
# result["fields"]["book"] = get_fields('fields_book')['fields_book']
# result["fields"]["image"] = get_fields('fields_image')['fields_image']
# result["fields"]["outing"] = get_fields('fields_outing')['fields_outing']
# result["fields"]["route"] = get_fields('fields_route')['fields_route']
# result["fields"]["map"] = get_fields('fields_topo_map')['fields_topo_map']
# result["fields"]["profile"] = get_fields('fields_user_profile')['fields_user_profile']
# result["fields"]["waypoint"] = get_fields('fields_waypoint')['fields_waypoint']
# result["fields"]["xreport"] = get_fields('fields_xreport')['fields_xreport']

attributes = get_fields('attributes')
result["attributes"] = {}
result["attributes"]["langs"] = attributes["langs_priority"]

attribute_names = (
    "access_conditions",
    "access_times",
    "activities",
    "activity_rates",
    "aid_ratings",
    "area_types",
    "article_categories",
    "article_types",
    "author_statuses",
    "autonomies",
    "avalanche_levels",
    "avalanche_signs",
    "avalanche_slopes",
    "book_types",
    "condition_ratings",
    "children_proof_types",
    "climbing_indoor_types",
    "climbing_outdoor_types",
    "climbing_outdoor_types",
    "climbing_ratings",
    "climbing_styles",
    "route_configuration_types",
    "custodianship_types",
    "route_duration_types",
    "engagement_ratings",
    "equipment_ratings",
    "event_types",
    "exposition_ratings",
    "exposition_rock_ratings",
    "frequentation_types",
    "genders",
    "glacier_gear_types",
    "glacier_ratings",
    "global_ratings",
    "ground_types",
    "hiking_ratings",
    "ice_ratings",
    "image_types",
    "image_categories",
    "labande_ski_ratings",
    "lift_status",
    "mixed_ratings",
    "months",
    "mtb_down_ratings",
    "mtb_up_ratings",
    "nb_outings",
    "orientation_types",
    "paragliding_ratings",
    "parking_fee_types",
    "previous_injuries",
    "product_types",
    "public_transportation_ratings",
    "public_transportation_types",
    "quality_types",
    "rain_proof_types",
    "risk_ratings",
    "climbing_ratings",
    "rock_types",
    "route_types",
    "severities",
    "exposition_ratings",
    "ski_ratings",
    "slackline_types",
    "snow_clearance_ratings",
    "snowshoe_ratings",
    "user_categories",
    "user_categories",
    "via_ferrata_ratings",
    "waypoint_types",
    "weather_station_types",
)

for attribute_name in attribute_names:
    result["attributes"][attribute_name] = attributes[attribute_name]

# del result["attributes"]["langs_priority"]
# del result["attributes"]["default_langs"]

# result["valid_associations"] = get_fields('associations')['valid_associations']
result["letter_types"] = get_fields('document_types')['ALL']

# result["sortable_search_attributes"] = get_fields('sortable_search_attributes')

with open("src/js/common.js", "w") as f:
    f.write("export default " + json.dumps(result, indent=4))
