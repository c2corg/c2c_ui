import requests
import json

URL = 'https://raw.githubusercontent.com/c2corg/v6_common/master/c2corg_common/{}.py'.format


def get_fields(name):
    exec(requests.get(URL(name)).text)
    return dict(locals())


result = {"fields": {}}

result["fields"]["area"] = get_fields('fields_area')['fields_area']
result["fields"]["article"] = get_fields('fields_area')['fields_area']
result["fields"]["book"] = get_fields('fields_area')['fields_area']
result["fields"]["image"] = get_fields('fields_area')['fields_area']
result["fields"]["outing"] = get_fields('fields_area')['fields_area']
result["fields"]["route"] = get_fields('fields_route')['fields_route']
result["fields"]["map"] = get_fields('fields_topo_map')['fields_topo_map']
result["fields"]["profile"] = get_fields('fields_user_profile')['fields_user_profile']
result["fields"]["waypoint"] = get_fields('fields_waypoint')['fields_waypoint']
result["fields"]["xreport"] = get_fields('fields_xreport')['fields_xreport']

result["attributes"] = get_fields('attributes')
result["attributes"]["langs"] = result["attributes"]["langs_priority"]

del result["attributes"]["langs_priority"]
del result["attributes"]["default_langs"]

# result["valid_associations"] = get_fields('associations')['valid_associations']
result["letter_types"] = get_fields('document_types')['ALL']

result["sortable_search_attributes"] = get_fields('sortable_search_attributes')

with open("src/js/common.js", "w") as f:
    f.write("export default " + json.dumps(result, indent=4))
